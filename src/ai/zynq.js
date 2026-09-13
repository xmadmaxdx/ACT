// Codino AI — Zynq HMAC transport (browser side).
// Secrets come ONLY from Vite env. Nothing is hardcoded here: no URL, no key,
// no fallback values. If env is missing, every call throws CodinoNotConfigured
// and the panel shows its offline state instead of failing silently.

export const CODINO_MODEL = "command-a-plus-05-2026";
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

export async function sendCodinoMessage({ messages, signal, fixedProvider = true }) {
  const { url, secret } = config();
  const timestamp = Date.now().toString();
  const signature = await signPayload("POST", CHAT_PATH, timestamp, CODINO_MODEL, secret);
  const res = await fetch(`${url}${CHAT_PATH}`, {
    method: "POST",
    headers: headers(signature, timestamp),
    body: JSON.stringify({ ...baseBody(CODINO_MODEL, messages, fixedProvider), stream: false }),
    signal,
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  const msg = data?.choices?.[0]?.message;
  const text = (msg && msg.content) || "";
  if (!text) throw new Error("Codino returned an empty answer. Try again.");
  return text;
}

// Streams token deltas via onToken(text). Resolves with the full text.
// Chunk boundaries never line up with SSE frames: buffer until "\n\n",
// keep the trailing fragment, decode multibyte chars with stream:true.
export async function streamCodinoMessage({ messages, signal, onToken, fixedProvider = true }) {
  const { url, secret } = config();
  const timestamp = Date.now().toString();
  const signature = await signPayload("POST", CHAT_PATH, timestamp, CODINO_MODEL, secret);
  const res = await fetch(`${url}${CHAT_PATH}`, {
    method: "POST",
    headers: headers(signature, timestamp),
    body: JSON.stringify({ ...baseBody(CODINO_MODEL, messages, fixedProvider), stream: true }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(await readError(res));
  const reader = res.body.getReader();
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
