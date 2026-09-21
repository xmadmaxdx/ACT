// Codino AI — Zynq HMAC transport (browser side).
// Secrets come ONLY from Vite env. Nothing is hardcoded here: no URL, no key,
// no fallback values. If env is missing, every call throws CodinoNotConfigured
// and the panel shows its offline state instead of failing silently.

export const CODINO_MODEL = "openai/gpt-oss-120b-g";
// Real vision contract: image attached -> "zynq-vision-auto" alias, otherwise
// the normal text model. Server decides image mode per-request from the LATEST
// user message, so text follow-ups automatically fall back to text mode.
export const VISION_ALIAS = "zynq-vision-auto";
export const VISION_MODEL = VISION_ALIAS;

// Ordered fallback pool (provider slug lists). Tried in order after the
// requested model until one answers or 5 attempts fail.
const FALLBACK_MODELS = [
  "gpt-oss-120b-c",
  "command-a-plus-05-2026",
  "command-a-plus-cc",
  "command-a-reasoning-cc",
  "mistral-large-latest-m",
  "gemma-4-31b-it-gg",
  "mistral-small-latest-m",
  "openai/gpt-oss-20b-g",
  "qwen-3-32b-c",
];

const MAX_ATTEMPTS = 5;

export function isImageMode(messages) {
  for (let i = (messages || []).length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!m || m.role !== "user") continue;
    const c = m.content;
    if (typeof c === "string") return false;
    if (!Array.isArray(c)) return false;
    return c.some(
      (p) =>
        p &&
        (p.type === "image_url" || p.type === "image") &&
        (p.image_url?.url || p.imageUrl?.url)
    );
  }
  return false;
}

export function pickModel(messages, textModel) {
  return isImageMode(messages) ? VISION_ALIAS : textModel || CODINO_MODEL;
}

function candidatesFor(model, messages) {
  const hasImages = (messages || []).some(
    (m) => Array.isArray(m.content) && m.content.some((p) => p && p.type === "image_url")
  );
  // Image turns only run on the vision model: text fallbacks would 400.
  if (hasImages) return [model];
  const seen = new Set();
  const out = [];
  for (const name of [model, ...FALLBACK_MODELS]) {
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
    if (out.length >= MAX_ATTEMPTS) break;
  }
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CHAT_PATH = "/v1/chat/completions";

function config() {
  const url = import.meta.env.VITE_ZYNQ_URL;
  const secret = import.meta.env.VITE_ZYNQ_SECRET;
  if (!url || !secret) {
    const err = new Error(
      "Codino is not configured. Set VITE_ZYNQ_URL and VITE_ZYNQ_SECRET in .env (and Netlify) then rebuild."
    );
    err.code = "CodinoNotConfigured";
    throw err;
  }
  return { url: String(url).replace(/\/$/, ""), secret };
}

export function isCodinoConfigured() {
  try {
    config();
    return true;
  } catch {
    return false;
  }
}

// Signs METHOD:FULL_PATH:TIMESTAMP:MODEL + secret via SHA-256, exactly as the
// Zynq server verifies it (crypto.createHash("sha256") over the same string).
async function signPayload(method, path, timestamp, model, secret) {
  const payload = `${method.toUpperCase()}:${path}:${timestamp}:${model}${secret}`;
  const bytes = new TextEncoder().encode(payload);
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function headers(signature, timestamp) {
  return {
    "Content-Type": "application/json",
    "x-zynq-signature": signature,
    "x-zynq-timestamp": timestamp,
  };
}

async function readError(res) {
  try {
    const data = await res.json();
    return (data && (data.error?.message || data.message)) || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

function baseBody(model, messages, fixedProvider) {
  return {
    model,
    messages,
    ...(fixedProvider !== undefined ? { fixed_provider: fixedProvider } : {}),
  };
}

export async function sendCodinoMessage({ messages, signal, fixedProvider = true, model = CODINO_MODEL, extra }) {
  const { url, secret } = config();
  let lastErr = "Codino hiccuped. Try again.";
  for (const name of candidatesFor(model, messages)) {
    const timestamp = Date.now().toString();
    const signature = await signPayload("POST", CHAT_PATH, timestamp, name, secret);
    let res;
    try {
      res = await fetch(`${url}${CHAT_PATH}`, {
        method: "POST",
        headers: headers(signature, timestamp),
        body: JSON.stringify({ ...baseBody(name, messages, fixedProvider), ...(extra || {}), stream: false }),
        signal,
      });
    } catch (e) {
      if (e && e.name === "AbortError") throw e;
      lastErr = (e && e.message) || lastErr;
      await sleep(1200);
      continue;
    }
    if (res.ok) {
      const data = await res.json();
      const msg = data?.choices?.[0]?.message;
      const text = (msg && msg.content) || "";
      if (text) return text;
      lastErr = "Codino returned an empty answer. Try again.";
      continue;
    }
    // Wrong secret: every model would fail the same way — stop immediately.
    if (res.status === 401) throw new Error(await readError(res));
    lastErr = await readError(res);
    await sleep(1200);
  }
  throw new Error(lastErr);
}

// Streams token deltas via onToken(text). Resolves with the full text.
// Tries up to 5 models in order (requested first, then the fallback pool).
// Chunk boundaries never line up with SSE frames: buffer until "\n\n",
// keep the trailing fragment, decode multibyte chars with stream:true.
export async function streamCodinoMessage({ messages, signal, onToken, fixedProvider = true, model = CODINO_MODEL }) {
  const { url, secret } = config();
  let lastErr = "Codino hiccuped. Try again.";
  for (const name of candidatesFor(model, messages)) {
    const timestamp = Date.now().toString();
    const signature = await signPayload("POST", CHAT_PATH, timestamp, name, secret);
    let res;
    try {
      res = await fetch(`${url}${CHAT_PATH}`, {
        method: "POST",
        headers: headers(signature, timestamp),
        body: JSON.stringify({ ...baseBody(name, messages, fixedProvider), stream: true }),
        signal,
      });
    } catch (e) {
      if (e && e.name === "AbortError") throw e;
      lastErr = (e && e.message) || lastErr;
      await sleep(1200);
      continue;
    }
    if (!res.ok || !res.body) {
      if (res.status === 401) throw new Error(await readError(res));
      lastErr = await readError(res);
      try {
        if (res.body) await res.body.cancel();
      } catch {
        /* body already consumed */
      }
      await sleep(1200);
      continue;
    }
    const full = await readStreamBody(res.body, onToken, signal);
    if (full) return full;
    lastErr = "Codino returned an empty answer. Try again.";
    await sleep(1200);
  }
  throw new Error(lastErr);
}

async function readStreamBody(body, onToken, signal) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() || "";
      for (const frame of frames) {
        const line = frame
          .split("\n")
          .map((l) => l.trim())
          .find((l) => l.startsWith("data:"));
        if (!line) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") {
          try {
            reader.cancel();
          } catch {
            /* already closed */
          }
          return full;
        }
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          continue;
        }
        const delta = parsed?.choices?.[0]?.delta;
        const piece = (delta && delta.content) || "";
        if (piece) {
          full += piece;
          if (onToken) onToken(piece);
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* already released */
    }
  }
  if (!full) throw new Error("Codino returned an empty answer. Try again.");
  return full;
}

const SPEECH_PATH = "/v1/audio/speech";
const STT_PATH = "/v1/audio/transcriptions";
export const TTS_MODEL = "zynq-tts-auto";
export const STT_MODEL = "zynq-stt-auto";

export async function speakCodinoText({ text, voice = "tara", speed = 1.0, signal }) {
  const clean = String(text || "").trim();
  if (!clean) throw new Error("Nothing to speak yet.");
  const { url, secret } = config();
  const timestamp = Date.now().toString();
  const signature = await signPayload("POST", SPEECH_PATH, timestamp, TTS_MODEL, secret);
  const res = await fetch(`${url}${SPEECH_PATH}`, {
    method: "POST",
    headers: { ...headers(signature, timestamp) },
    body: JSON.stringify({ model: TTS_MODEL, input: clean.slice(0, 4000), voice, speed }),
    signal,
  });
  if (!res.ok) throw new Error(await readError(res));
  return await res.blob();
}

export async function transcribeCodinoAudio({ blob, filename = "note.webm", language = "en", signal }) {
  if (!blob || blob.size === 0) throw new Error("No audio captured. Try again.");
  if (blob.size > 25 * 1024 * 1024) throw new Error("Clip is over 25 MB. Record a shorter note.");
  const { url, secret } = config();
  const timestamp = Date.now().toString();
  const signature = await signPayload("POST", STT_PATH, timestamp, STT_MODEL, secret);
  const form = new FormData();
  form.append("model", STT_MODEL);
  if (language) form.append("language", language);
  form.append("file", blob, filename);
  const res = await fetch(`${url}${STT_PATH}`, {
    method: "POST",
    headers: { "x-zynq-signature": signature, "x-zynq-timestamp": timestamp },
    body: form,
    signal,
  });
  if (!res.ok) throw new Error(await readError(res));
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("text/plain")) return (await res.text()).trim();
  const data = await res.json();
  return String(data?.text || "").trim();
}
