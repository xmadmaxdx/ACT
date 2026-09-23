// Codino AI panel — pinned right rail + unpinned floating modal.
// TestScreen owns open/context; everything else (tabs, threads, streaming)
// lives here. AI text renders as plain text only — never HTML.

import { useEffect, useMemo, useRef, useState } from "react";
import "./codino.css";
import CodinoMascot from "./mascot.jsx";
import { isCodinoConfigured, streamCodinoMessage, sendCodinoMessage, speakCodinoText, transcribeCodinoAudio, VISION_ALIAS, CODINO_MODEL } from "./zynq.js";
import {
  ASK_SYSTEM,
  EXPLAIN_SYSTEM,
  FORMAT_CONTRACT,
  buildExplanation,
  buildQuestionContext,
  generalContext,
  passageText,
  speakableText,
  speechText,
} from "./prompts.js";
import { renderAiText } from "./rich.jsx";
import { loadThreads, makeThread, persistThreads } from "./history.js";

const NARROW = "(max-width: 980px)";

function useNarrow() {
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(NARROW).matches
  );
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(NARROW);
    const onChange = (e) => setNarrow(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);
  return narrow;
}

function contextKey(ctx) {
  if (!ctx || !ctx.q) return "general";
  return `${ctx.testData.id}-Q${ctx.q.n}`;
}

const CALL_SYSTEM =
  "You are a friendly voice tutor on a live call inside the ACTprep app. Reply in at most 35 words, plain speech only: no markdown, no lists, no emoji. Be warm and conversational.";
const CALL_LLM = "openai/gpt-oss-20b-g";
const CALL_MAX_TOKENS = 300;
const CALL_FALLBACK = "Sorry, I didn't catch that — say it once more?";

const ORB_COLORS = {
  idle: ["#6d58ff", "#3b82f6", "#8b5cf6"],
  listening: ["#22d3ee", "#38bdf6", "#818cf8"],
  thinking: ["#fbbf24", "#f59e0b", "#fde68a"],
  speaking: ["#f472b6", "#e879f9", "#818cf8"],
};

function CodinoOrb({ stateRef, levelRef }) {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const offRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return undefined;
    const ctx = cv.getContext("2d");
    const orb = { smooth: 0, t: 0 };
    const calm =
      typeof window !== "undefined" &&
      !!window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const draw = () => {
      const state = stateRef.current;
      const W = cv.width;
      const cx = W / 2 + offRef.current.x;
      const cy = W / 2 + offRef.current.y;
      orb.t += 0.03;
      orb.smooth += (levelRef.current - orb.smooth) * 0.12;
      const st = ORB_COLORS[state] || ORB_COLORS.idle;
      const speedMul = state === "thinking" ? 3 : 1;
      ctx.clearRect(0, 0, W, W);
      ctx.globalCompositeOperation = "lighter";
      const g0 = ctx.createRadialGradient(cx, cy, 10, cx, cy, 150);
      g0.addColorStop(0, `${st[0]}44`);
      g0.addColorStop(1, `${st[0]}00`);
      ctx.fillStyle = g0;
      ctx.fillRect(0, 0, W, W);
      const base = 58 + Math.sin(orb.t * 1.2 * speedMul) * 4 + orb.smooth * 44;
      ctx.beginPath();
      for (let a = 0; a <= 72; a++) {
        const th = (a / 72) * Math.PI * 2;
        const wob =
          (Math.sin(th * 3 + orb.t * 1.7 * speedMul) * 7 +
            Math.sin(th * 5 - orb.t * 1.1 * speedMul) * 5) *
          (0.35 + orb.smooth);
        const r = base + wob;
        const x = cx + Math.cos(th) * r;
        const y = cy + Math.sin(th) * r;
        if (a) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.closePath();
      const g1 = ctx.createRadialGradient(cx, cy, 6, cx, cy, base + 30);
      g1.addColorStop(0, "#ffffffee");
      g1.addColorStop(0.35, `${st[0]}dd`);
      g1.addColorStop(0.7, `${st[1]}77`);
      g1.addColorStop(1, `${st[2]}00`);
      ctx.fillStyle = g1;
      ctx.fill();
      if (ctx.createConicGradient) {
        const cg = ctx.createConicGradient(orb.t * 0.5 * speedMul, cx, cy);
        cg.addColorStop(0, "rgba(255,255,255,0)");
        cg.addColorStop(0.1, "rgba(255,255,255,0.30)");
        cg.addColorStop(0.2, "rgba(255,255,255,0)");
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(cx, cy, base * 0.95, 0, 7);
        ctx.fill();
      }
      if (state === "listening" || state === "talking") {
        for (let i = 0; i < 2; i++) {
          const ph = (orb.t * 0.5 + i * 0.5) % 1;
          ctx.strokeStyle = `rgba(103,232,249,${((1 - ph) * 0.5).toFixed(3)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, base + 10 + ph * 48, 0, 7);
          ctx.stroke();
        }
      }
      if (state === "speaking") {
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        for (let i = 0; i < 7; i++) {
          const bx = cx - 48 + i * 16;
          const bh = 8 + Math.abs(Math.sin(orb.t * 3.2 + i * 1.4)) * (10 + orb.smooth * 30);
          ctx.fillRect(bx - 3, cy - bh / 2, 6, bh);
        }
      }
      if (!calm) raf = requestAnimationFrame(draw);
    };
    if (calm) draw();
    else raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [stateRef, levelRef]);

  return (
    <canvas
      ref={canvasRef}
      className="cod-orb-canvas"
      width={300}
      height={300}
      aria-hidden="true"
      onPointerDown={(e) => {
        dragRef.current = { x: e.clientX, y: e.clientY, ox: offRef.current.x, oy: offRef.current.y };
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* pointer capture unsupported */
        }
      }}
      onPointerMove={(e) => {
        const d = dragRef.current;
        if (!d) return;
        offRef.current = { x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) };
      }}
      onPointerUp={() => {
        dragRef.current = null;
      }}
      onPointerCancel={() => {
        dragRef.current = null;
      }}
    />
  );
}

function flattenF32(chunks) {
  const n = chunks.reduce((a, c) => a + c.length, 0);
  const out = new Float32Array(n);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

function wav16Bytes(f32, sr) {
  const buf = new ArrayBuffer(44 + f32.length * 2);
  const v = new DataView(buf);
  const ws = (o, s) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  ws(0, "RIFF");
  v.setUint32(4, 36 + f32.length * 2, true);
  ws(8, "WAVE");
  ws(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sr, true);
  v.setUint32(28, sr * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  ws(36, "data");
  v.setUint32(40, f32.length * 2, true);
  for (let i = 0; i < f32.length; i++) {
    v.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, f32[i] * 32767)), true);
  }
  return new Blob([buf], { type: "audio/wav" });
}

function CodinoCall({ context, onClose }) {
  const [callState, setCallState] = useState("listening");
  const [log, setLog] = useState([]);
  const [muted, setMuted] = useState(false);
  const [talking, setTalking] = useState(false);
  const [manual, setManual] = useState(false);
  const [awaiting, setAwaiting] = useState(false);
  const [callError, setCallError] = useState("");
  const engineRef = useRef(null);
  const stateRef = useRef("listening");
  const levelRef = useRef(0);
  const captionRef = useRef(null);
  const capStickRef = useRef(true);

  useEffect(() => {
    const el = captionRef.current;
    if (el && capStickRef.current) el.scrollTop = el.scrollHeight;
  }, [log]);

  useEffect(() => {
    const eng = {
      active: true,
      speaking: false,
      muted: false,
      talking: false,
      manual: false,
      awaiting: false,
      turnId: 0,
      buf: [],
      bufSpeech: false,
      silenceMs: 0,
      lastFrame: 0,
      bargeCount: 0,
      bargeAt: 0,
      speakStart: 0,
      outLevel: 0,
      playNodes: [],
      history: [{ role: "system", content: CALL_SYSTEM }],
    };
    engineRef.current = eng;
    let mic = null;
    let actx = null;
    let proc = null;

    const setState = (s) => {
      if (!engineRef.current) return;
      stateRef.current = s;
      setCallState(s);
    };
    const pushLog = (role, text) => setLog((prev) => [...prev.slice(-4), { role, text }]);

    const stopAllAudio = () => {
      (eng.playNodes || []).forEach((n) => {
        try {
          n.src.stop();
        } catch {
          /* already stopped */
        }
        try {
          n.ctx.close();
        } catch {
          /* already closed */
        }
      });
      eng.playNodes = [];
    };

    const interruptAgent = () => {
      eng.turnId += 1;
      eng.speaking = false;
      eng.outLevel = 0;
      eng.awaiting = false;
      setAwaiting(false);
      eng.bargeAt = performance.now();
      stopAllAudio();
      levelRef.current = 0;
      setState(eng.manual ? "waiting" : "listening");
    };
    eng.interruptAgent = interruptAgent;

    const playReply = async (blob, myTurn) => {
      if (myTurn !== eng.turnId || !eng.active) return;
      const url = URL.createObjectURL(blob);
      eng.speaking = true;
      eng.speakStart = performance.now();
      eng.bargeCount = 0;
      setState("speaking");
      const pctx = new AudioContext();
      const src = pctx.createBufferSource();
      try {
        src.buffer = await pctx.decodeAudioData(await blob.arrayBuffer());
      } catch {
        URL.revokeObjectURL(url);
        try {
          pctx.close();
        } catch {
          /* already closed */
        }
        if (eng.speaking && myTurn === eng.turnId) {
          eng.speaking = false;
          eng.awaiting = false;
          setAwaiting(false);
          if (eng.active) {
            levelRef.current = 0;
            setState(eng.manual ? "waiting" : "listening");
          }
        }
        return;
      }
      eng.playNodes.push({ src, ctx: pctx });
      const an = pctx.createAnalyser();
      an.fftSize = 256;
      src.connect(an);
      an.connect(pctx.destination);
      const data = new Uint8Array(an.frequencyBinCount);
      const tick = () => {
        if (!eng.speaking) return;
        an.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const x = (data[i] - 128) / 128;
          sum += x * x;
        }
        const out = Math.min(1, Math.sqrt(sum / data.length) * 5);
        eng.outLevel = out;
        levelRef.current = out;
        requestAnimationFrame(tick);
      };
      tick();
      await new Promise((resolve) => {
        src.onended = resolve;
        src.start();
      });
      eng.playNodes = eng.playNodes.filter((n) => n.src !== src);
      URL.revokeObjectURL(url);
      try {
        pctx.close();
      } catch {
        /* already closed */
      }
      if (eng.speaking && myTurn === eng.turnId && eng.active) {
        eng.speaking = false;
        eng.awaiting = false;
        setAwaiting(false);
        levelRef.current = 0;
        setState(eng.manual ? "waiting" : "listening");
      }
    };

    const endUtterance = async () => {
      const myTurn = ++eng.turnId;
      const pcm = flattenF32(eng.buf);
      eng.buf = [];
      eng.bufSpeech = false;
      eng.silenceMs = 0;
      if (!eng.active) return;
      setState(eng.manual ? "waiting" : "thinking");
      try {
        const wav = wav16Bytes(pcm, 16000);
        const userText = (await transcribeCodinoAudio({ blob: wav, filename: "utt.wav", language: "en" })).trim();
        if (!userText) {
          if (eng.active) {
            levelRef.current = 0;
            eng.awaiting = false;
            setAwaiting(false);
            setState(eng.manual ? "waiting" : "listening");
          }
          return;
        }
        pushLog("user", userText);
        eng.history.push({ role: "user", content: userText });
        if (eng.history.length > 17) eng.history = [eng.history[0], ...eng.history.slice(-16)];
        let reply = "";
        for (let attempt = 0; attempt < 3 && !reply && eng.active; attempt++) {
          const text = await sendCodinoMessage({
            model: CALL_LLM,
            messages: eng.history,
            extra: { max_tokens: CALL_MAX_TOKENS, reasoning_effort: "low" },
          });
          reply = String(text || "").trim();
        }
        if (!reply) reply = CALL_FALLBACK;
        if (myTurn !== eng.turnId || !eng.active) return;
        const speakText = speechText(reply) || CALL_FALLBACK;
        eng.history.push({ role: "assistant", content: reply });
        pushLog("assistant", speakText);
        const audioBlob = await speakCodinoText({ text: speakText, voice: "flux-alexis-en", stream: true });
        await playReply(audioBlob, myTurn);
      } catch (e) {
        if (!eng.active) return;
        eng.awaiting = false;
        setAwaiting(false);
        pushLog("error", (e && e.message) || "Call error. Try again.");
        setState(eng.manual ? "waiting" : "listening");
      }
    };

    eng.endUtterance = endUtterance;

    const onFrame = (e) => {
      if (!eng.active) return;
      const f32 = e.inputBuffer.getChannelData(0);
      let sum = 0;
      for (let i = 0; i < f32.length; i++) sum += f32[i] * f32[i];
      const rms = Math.sqrt(sum / f32.length);
      if (eng.speaking) {
        const live = !eng.muted && !eng.manual;
        const echoFloor = eng.outLevel * 1.8 + 0.05;
        if (live && rms > 0.09 && rms > echoFloor && performance.now() - eng.speakStart > 500) {
          eng.bargeCount += 1;
          if (eng.bargeCount >= 3) {
            eng.bargeCount = 0;
            interruptAgent();
          }
        } else {
          eng.bargeCount = 0;
        }
        return;
      }
      if (eng.talking) {
        if (!eng.bufSpeech) {
          eng.buf = [];
          eng.bufSpeech = true;
        }
        eng.buf.push(new Float32Array(f32));
        eng.silenceMs = 0;
        levelRef.current = Math.min(1, rms * 6);
        eng.lastFrame = performance.now();
        return;
      }
      if (eng.manual) {
        levelRef.current = 0;
        eng.lastFrame = performance.now();
        return;
      }
      const now = performance.now();
      if (now - eng.bargeAt < 300) {
        eng.lastFrame = now;
        return;
      }
      if (eng.muted) {
        levelRef.current = 0;
        eng.lastFrame = now;
        return;
      }
      levelRef.current = Math.min(1, rms * 6);
      if (rms > 0.02) {
        if (!eng.bufSpeech) {
          eng.buf = [];
          eng.bufSpeech = true;
        }
        eng.buf.push(new Float32Array(f32));
        eng.silenceMs = 0;
      } else if (eng.bufSpeech) {
        eng.silenceMs += now - eng.lastFrame;
        eng.buf.push(new Float32Array(f32));
        if (eng.silenceMs > 700 && eng.buf.length * 128 > 400) endUtterance();
      }
      eng.lastFrame = now;
    };

    (async () => {
      try {
        mic = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
        });
        if (!eng.active) {
          mic.getTracks().forEach((t) => t.stop());
          return;
        }
        actx = new AudioContext({ sampleRate: 16000 });
        const src = actx.createMediaStreamSource(mic);
        proc = actx.createScriptProcessor(2048, 1, 1);
        proc.onaudioprocess = onFrame;
        src.connect(proc);
        proc.connect(actx.destination);
        eng.nodes = { mic, actx, proc };
        setState("listening");
      } catch {
        setCallError("Microphone blocked. Allow mic access, then try again.");
        setState("idle");
      }
    })();

    return () => {
      eng.active = false;
      stopAllAudio();
      try {
        proc?.disconnect();
      } catch {
        /* already closed */
      }
      try {
        actx?.close();
      } catch {
        /* already closed */
      }
      try {
        mic?.getTracks().forEach((t) => t.stop());
      } catch {
        /* already stopped */
      }
    };
  }, []);

  const toggleMute = () => {
    const eng = engineRef.current;
    setMuted((m) => {
      if (eng) eng.muted = !m;
      return !m;
    });
  };

  const restartTalk = () => {
    const eng = engineRef.current;
    if (!eng || !eng.active || !eng.talking) return;
    eng.buf = [];
    eng.bufSpeech = true;
    eng.silenceMs = 0;
    eng.bargeCount = 0;
    eng.lastFrame = performance.now();
    levelRef.current = 0;
  };

  const talkTap = () => {
    const eng = engineRef.current;
    if (!eng || !eng.active || callState === "idle") return;
    if (eng.talking) {
      eng.talking = false;
      setTalking(false);
      levelRef.current = 0;
      if (!eng.speaking && eng.bufSpeech && eng.buf.length * 128 > 400 && eng.endUtterance) {
        eng.awaiting = true;
        setAwaiting(true);
        eng.endUtterance();
      } else {
        eng.buf = [];
        eng.bufSpeech = false;
        setStateFallback(eng);
      }
      return;
    }
    eng.turnId += 1;
    eng.awaiting = false;
    setAwaiting(false);
    if (eng.speaking) eng.interruptAgent();
    eng.manual = true;
    setManual(true);
    eng.talking = true;
    setTalking(true);
    eng.buf = [];
    eng.bufSpeech = true;
    eng.silenceMs = 0;
    eng.bargeCount = 0;
    levelRef.current = 0;
    stateRef.current = "talking";
    setCallState("talking");
  };

  const setStateFallback = (eng) => {
    stateRef.current = eng.manual ? "waiting" : "listening";
    setCallState(eng.manual ? "waiting" : "listening");
  };

  const backToAuto = () => {
    const eng = engineRef.current;
    if (!eng || !eng.active) return;
    eng.manual = false;
    setManual(false);
    eng.awaiting = false;
    setAwaiting(false);
    if (eng.talking) {
      eng.talking = false;
      setTalking(false);
      eng.buf = [];
      eng.bufSpeech = false;
    }
    if (!eng.speaking) {
      levelRef.current = 0;
      stateRef.current = "listening";
      setCallState("listening");
    }
  };

  return (
    <div className="cod-call-overlay" onClick={onClose}>
      <div className="cod-call-card" role="dialog" aria-label="Codino live call" onClick={(e) => e.stopPropagation()}>
        {manual && (
          <button type="button" className="cod-auto-link" onClick={backToAuto}>
            Back to auto-listen
          </button>
        )}
        <CodinoOrb stateRef={stateRef} levelRef={levelRef} />
        <p className="cod-call-status">
          {callState === "talking"
            ? "Talking… tap again to send"
            : callState === "waiting"
              ? "Waiting… tap Talk to speak"
              : callState === "listening"
                ? "Listening…"
                : callState === "thinking"
                  ? "Thinking…"
                  : callState === "speaking"
                    ? "Speaking… (talk to interrupt)"
                    : "Call"}
        </p>
        {context?.q ? (
          <p className="cod-call-sub">
            Q{context.q.n} · {context.q.tag}
          </p>
        ) : null}
        <div
          className="cod-call-captions"
          ref={captionRef}
          aria-live="polite"
          onScroll={() => {
            const el = captionRef.current;
            if (!el) return;
            capStickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
          }}
        >
          {log.length === 0 && <p className="cod-cap">Say something — Codino is listening.</p>}
          {log.map((m, i) => (
            <p key={i} className={m.role === "error" ? "cod-cap cod-cap-err" : "cod-cap"}>
              {m.role === "user" ? "You: " : m.role === "assistant" ? "Codino: " : ""}{m.text}
            </p>
          ))}
        </div>
        {callError && <p className="cod-error">{callError}</p>}
        <div className="cod-call-actions">
          {talking ? (
            <button type="button" className="cod-ghost" onClick={restartTalk} aria-label="Restart recording">
              Restart
            </button>
          ) : (
            <button type="button" className={muted ? "cod-ghost on" : "cod-ghost"} onClick={toggleMute} aria-pressed={muted}>
              {muted ? "Unmute" : "Mute"}
            </button>
          )}
          <span className="cod-talk-wrap">
            <button
              type="button"
              className={talking ? "cod-talk recording" : awaiting ? "cod-talk reply" : manual ? "cod-talk manual" : "cod-talk"}
              onClick={talkTap}
              aria-pressed={talking}
              aria-label={talking ? "Stop recording and send to Codino" : awaiting ? "Codino is replying" : "Talk to Codino"}
              disabled={callState === "idle"}
            >
              <svg width="22" height="22" viewBox="0 0 16 16" aria-hidden="true">
                <rect x="6" y="1.5" width="4" height="7.5" rx="2" fill="currentColor" />
                <path
                  d="M3.5 7.5a4.5 4.5 0 0 0 9 0M8 12v2.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              {talking && (
                <svg className="cod-talk-ring" viewBox="0 0 64 64" aria-hidden="true">
                  <circle cx="32" cy="32" r="28" />
                </svg>
              )}
            </button>
            <span className="cod-talk-label">{talking ? "Tap to send" : awaiting ? "Reply coming…" : "Tap to talk"}</span>
          </span>
          <button type="button" className="cod-ghost danger" onClick={onClose}>
            End call
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CodinoPanel({ open, pinned, onTogglePin, context, onClose }) {
  const narrow = useNarrow();
  const modal = !pinned || narrow;
  const [showHistory, setShowHistory] = useState(false);
  const [threads, setThreads] = useState(() => loadThreads());
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState("");
  const [images, setImages] = useState([]);
  const fileRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [stuck, setStuck] = useState(true);
  const [error, setError] = useState("");
  const [configured] = useState(() => isCodinoConfigured());
  const [speakingKey, setSpeakingKey] = useState(null);
  const [speakLoading, setSpeakLoading] = useState(null);
  const [recording, setRecording] = useState(false);
  const [micBusy, setMicBusy] = useState(false);
  const [dictOpen, setDictOpen] = useState(false);
  const [dictSecs, setDictSecs] = useState(0);
  const [dictReady, setDictReady] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const audioRef = useRef(null);
  const speakKeyRef = useRef(0);
  const recorderRef = useRef(null);
  const micChunksRef = useRef([]);
  const micStreamRef = useRef(null);
  const dictCancelRef = useRef(false);
  const dictSessionRef = useRef(0);
  const dictRafRef = useRef(null);
  const dictTimerRef = useRef(null);
  const dictCtxRef = useRef(null);
  const dictCanvasRef = useRef(null);
  const abortRef = useRef(null);
  const frameRef = useRef(null);
  const pendingRef = useRef("");
  const listRef = useRef(null);
  const stickRef = useRef(true);
  const inputRef = useRef(null);
  const threadsRef = useRef([]);
  useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);

  const ctx = context || null;
  const key = contextKey(ctx);

  // Adopt a thread for this question (or general) whenever the panel opens.
  // Explain-pill opens carry autoAsk: the question fires immediately.
  useEffect(() => {
    if (!open) return;
    setError("");
    setShowHistory(false);
    const prev = threadsRef.current;
    const hit = prev.find((t) => t.testId === (ctx?.testData?.id || null) && (t.qn ?? null) === (ctx?.q?.n ?? null));
    const auto = ctx?.autoAsk || null;
    if (hit) {
      setActiveId(hit.id);
      if (auto && hit.messages.length === 0) {
        pushMessages(hit.id, () => [{ role: "user", content: auto }]);
        runStream(hit.id, CODINO_MODEL, { content: auto });
      }
      return;
    }
    const base = ctx?.q
      ? buildQuestionContext({ testData: ctx.testData, q: ctx.q, pickedLetter: ctx.pickedLetter, letters: ctx.letters, reveal: ctx.reveal })
      : generalContext(ctx?.testData?.section);
    const fresh = makeThread({ title: base.title, testId: ctx?.testData?.id || null, qn: ctx?.q?.n ?? null });
    const next = [fresh, ...prev];
    threadsRef.current = next;
    setThreads(next);
    persistThreads(next);
    setActiveId(fresh.id);
    if (auto) {
      pushMessages(fresh.id, () => [{ role: "user", content: auto }]);
      runStream(fresh.id, CODINO_MODEL, { content: auto });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, key]);

  const active = threads.find((t) => t.id === activeId) || null;
  const messages = active ? active.messages : [];
  const passageStr = useMemo(() => {
    if (!ctx || !ctx.q) return "";
    const pg = (ctx.testData.passages || []).find((p) => p.id === ctx.q.p);
    return passageText(pg);
  }, [ctx?.testData?.id ?? null, ctx?.q?.n ?? null, ctx?.q?.p ?? null]);
  // Option truth for OPTION: cards. Hidden mid-exam: every card neutral so
  // the panel can never leak the key through styling.
  const answerOpts = useMemo(() => {
    if (!ctx || !ctx.q) return null;
    const built = buildExplanation({ q: ctx.q, pickedLetter: ctx.pickedLetter, letters: ctx.letters });
    if (ctx.reveal === false) return built.options.map((o) => ({ ...o, state: "other" }));
    return built.options;
  }, [ctx?.testData?.id ?? null, ctx?.q?.n ?? null, ctx?.pickedLetter ?? null, ctx?.reveal ?? null]);

  const pushMessages = (id, updater) => {
    setThreads((prev) => {
      const next = prev.map((t) =>
        t.id === id ? { ...t, messages: updater(t.messages), updatedAt: Date.now() } : t
      );
      persistThreads(next);
      return next;
    });
  };

  const flushFrame = (id) => {
    frameRef.current = null;
    if (!pendingRef.current) return;
    const piece = pendingRef.current;
    pendingRef.current = "";
    pushMessages(id, (msgs) => {
      if (msgs.length === 0) return msgs;
      const last = msgs[msgs.length - 1];
      return [...msgs.slice(0, -1), { ...last, content: last.content + piece }];
    });
  };

  const scheduleFlush = (id) => {
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => flushFrame(id));
  };

  const stop = () => {
    if (abortRef.current) abortRef.current.abort();
  };

  const stopSpeaking = () => {
    speakKeyRef.current += 1;
    try {
      audioRef.current?.pause();
    } catch {
      /* already stopped */
    }
    audioRef.current = null;
    setSpeakingKey(null);
    setSpeakLoading(null);
  };

  const speakMessage = async (key, text) => {
    if (speakingKey === key) {
      stopSpeaking();
      return;
    }
    if (!configured) {
      setError("Codino is not configured. Set VITE_ZYNQ_URL and VITE_ZYNQ_SECRET in .env (and Netlify) then rebuild.");
      return;
    }
    const plain = speakableText(text, answerOpts);
    if (!plain) return;
    stopSpeaking();
    const myKey = (speakKeyRef.current += 1);
    setSpeakLoading(key);
    try {
      const blob = await speakCodinoText({ text: plain, voice: "tara" });
      if (speakKeyRef.current !== myKey) return;
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      setSpeakLoading(null);
      setSpeakingKey(key);
      try {
        await audio.play();
      } catch {
        if (speakKeyRef.current === myKey) stopSpeaking();
        URL.revokeObjectURL(url);
        return;
      }
      await new Promise((resolve) => {
        audio.onended = resolve;
        audio.onerror = resolve;
      });
      URL.revokeObjectURL(url);
      if (speakKeyRef.current === myKey) {
        audioRef.current = null;
        setSpeakingKey(null);
      }
    } catch (e) {
      if (speakKeyRef.current !== myKey) return;
      setSpeakLoading(null);
      setSpeakingKey(null);
      setError((e && e.message) || "Voice failed. Try again.");
    }
  };

  const cleanupDictAudio = () => {
    if (dictRafRef.current !== null) {
      cancelAnimationFrame(dictRafRef.current);
      dictRafRef.current = null;
    }
    if (dictTimerRef.current !== null) {
      clearInterval(dictTimerRef.current);
      dictTimerRef.current = null;
    }
    try {
      dictCtxRef.current?.close();
    } catch {
      /* already closed */
    }
    dictCtxRef.current = null;
  };

  const startDictLoop = (an) => {
    const calm =
      typeof window !== "undefined" &&
      !!window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const data = new Uint8Array(an.fftSize);
    const paint = () => {
      const cv = dictCanvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      const W = cv.width;
      const H = cv.height;
      ctx.clearRect(0, 0, W, H);
      const N = 56;
      const gap = 3;
      const bw = (W - gap * (N - 1)) / N;
      ctx.fillStyle = "#c3c3c3";
      for (let i = 0; i < N; i++) {
        const a = Math.floor((i / N) * data.length);
        const b = Math.max(a + 1, Math.floor(((i + 1) / N) * data.length));
        let s2 = 0;
        for (let j = a; j < b; j++) {
          const v = (data[j] - 128) / 128;
          s2 += v * v;
        }
        const seg = Math.sqrt(s2 / (b - a));
        const h = Math.max(3, Math.min(H, seg * H * 3.4));
        const x = i * (bw + gap);
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x, H / 2 - h / 2, bw, h, Math.min(bw / 2, 2));
          ctx.fill();
        } else {
          ctx.fillRect(x, H / 2 - h / 2, bw, h);
        }
      }
    };
    const draw = () => {
      an.getByteTimeDomainData(data);
      paint();
      if (!calm) dictRafRef.current = requestAnimationFrame(draw);
    };
    draw();
  };

  const openDictation = async () => {
    if (recording || micBusy || streaming) return;
    if (!configured) {
      setError("Codino is not configured. Set VITE_ZYNQ_URL and VITE_ZYNQ_SECRET in .env (and Netlify) then rebuild.");
      return;
    }
    const session = ++dictSessionRef.current;
    setDictSecs(0);
    setDictReady(false);
    setDictOpen(true);
    setRecording(true);
    dictTimerRef.current = window.setInterval(() => setDictSecs((s) => s + 1), 1000);
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      if (dictSessionRef.current !== session) return;
      setError("Microphone blocked. Allow mic access, then try again.");
      setRecording(false);
      cleanupDictAudio();
      setDictOpen(false);
      return;
    }
    if (dictSessionRef.current !== session) {
      try {
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        /* tracks already stopped */
      }
      return;
    }
    try {
      micStreamRef.current = stream;
      const rec = new MediaRecorder(stream);
      micChunksRef.current = [];
      dictCancelRef.current = false;
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size) micChunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        setRecording(false);
        cleanupDictAudio();
        try {
          micStreamRef.current?.getTracks().forEach((t) => t.stop());
        } catch {
          /* tracks already stopped */
        }
        micStreamRef.current = null;
        const chunks = micChunksRef.current;
        micChunksRef.current = [];
        if (dictCancelRef.current || !chunks.length) {
          setDictOpen(false);
          return;
        }
        const mime = (rec.mimeType || "audio/webm").split(";")[0];
        const ext = mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : mime.includes("wav") ? "wav" : "webm";
        const blob = new Blob(chunks, { type: mime });
        setMicBusy(true);
        try {
          const text = await transcribeCodinoAudio({ blob, filename: `note.${ext}`, language: "en" });
          if (text) {
            setInput((prev) => (prev && !prev.endsWith(" ") ? `${prev} ${text}` : `${prev || ""}${text}`));
          } else {
            setError("Didn't catch that. Try again.");
          }
        } catch (e) {
          setError((e && e.message) || "Dictation failed. Try again.");
        } finally {
          setMicBusy(false);
          setDictOpen(false);
        }
      };
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        try {
          const actx = new AC();
          dictCtxRef.current = actx;
          const src = actx.createMediaStreamSource(stream);
          const an = actx.createAnalyser();
          an.fftSize = 1024;
          src.connect(an);
          startDictLoop(an);
        } catch {
          /* visualizer unavailable — recording continues without waves */
        }
      }
      recorderRef.current = rec;
      rec.start();
      if (dictSessionRef.current !== session) {
        try {
          rec.stop();
        } catch {
          /* already stopped */
        }
        return;
      }
      setDictReady(true);
    } catch {
      if (dictSessionRef.current !== session) return;
      setError("Could not start recording. Try again.");
      try {
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        /* tracks already stopped */
      }
      setRecording(false);
      cleanupDictAudio();
      setDictOpen(false);
    }
  };

  const stopDictation = (cancel) => {
    dictSessionRef.current += 1;
    dictCancelRef.current = !!cancel;
    const rec = recorderRef.current;
    if (rec && rec.state === "recording") {
      try {
        rec.stop();
      } catch {
        setRecording(false);
        cleanupDictAudio();
        setDictOpen(false);
      }
    } else {
      setRecording(false);
      cleanupDictAudio();
      setDictOpen(false);
    }
  };

  useEffect(
    () => () => {
      dictSessionRef.current += 1;
      if (abortRef.current) abortRef.current.abort();
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      speakKeyRef.current += 1;
      try {
        audioRef.current?.pause();
      } catch {
        /* already stopped */
      }
      try {
        recorderRef.current?.state === "recording" && recorderRef.current?.stop();
      } catch {
        /* recorder already stopped */
      }
      try {
        micStreamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {
        /* tracks already stopped */
      }
      cleanupDictAudio();
    },
    []
  );

  useEffect(() => {
    if (!open && dictOpen) stopDictation(true);
  }, [open]);

  const onScrollList = () => {
    const el = listRef.current;
    if (!el) return;
    const s = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    stickRef.current = s;
    setStuck((prev) => (prev === s ? prev : s));
  };

  const jumpDown = () => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    stickRef.current = true;
    setStuck(true);
  };

  const autoresize = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  useEffect(autoresize, [input, open]);

  useEffect(() => {
    const el = listRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages.length, messages.length > 0 ? messages[messages.length - 1].content.length : 0]);

  // Context rides in the USER turns, not just system: models obey user
  // content far more reliably. Only the FIRST user turn carries the full
  // passage + question block; follow-ups carry a short pointer so the model
  // answers the new message instead of re-explaining the whole question.
  const shortContext = (base) =>
    `Continuing ${base.title || "this question"} (${base.brief || "see context above"}). ` +
    `The full question context was already provided earlier in this thread — ` +
    `answer only what the student now says, and do not restate it.`;

  const baseContext = () =>
    ctx?.q
      ? buildQuestionContext({ testData: ctx.testData, q: ctx.q, pickedLetter: ctx.pickedLetter, letters: ctx.letters, reveal: ctx.reveal })
      : generalContext(ctx?.testData?.section);

  const toApiUser = (content, images, base, full) => {
    const head = full ? base.contextText : shortContext(base);
    const text = `${head}\n\n${content || ""}`;
    if (images && images.length) {
      return {
        role: "user",
        content: [
          { type: "text", text: text.trim() || "Describe what you see in this image in detail." },
          ...images.map((u) => ({ type: "image_url", image_url: { url: u } })),
        ],
      };
    }
    return { role: "user", content: text };
  };

  const historyFor = (id) => {
    const base = baseContext();
    const sys = `${ctx?.q && ctx.reveal !== false ? EXPLAIN_SYSTEM : ASK_SYSTEM}\n\n${FORMAT_CONTRACT}`;
    const t = threadsRef.current.find((x) => x.id === id);
    let seenUser = false;
    const prior = (t ? t.messages : []).map((m) => {
      if (m.role !== "user") return { role: m.role, content: m.content };
      const full = !seenUser;
      seenUser = true;
      return toApiUser(m.content, m.images, base, full);
    });
    return [{ role: "system", content: sys }, ...prior];
  };

  const processImage = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1024;
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.8));
        };
        img.onerror = () => reject(new Error("Could not read that image."));
        img.src = reader.result;
      };
      reader.onerror = () => reject(new Error("Could not read that image."));
      reader.readAsDataURL(file);
    });

  const addImages = async (files) => {
    const shots = (files || []).filter((f) => f && f.type && f.type.startsWith("image/"));
    if (!shots.length) return;
    const room = Math.max(0, 2 - images.length);
    if (!room) {
      setError("Max 2 images per message.");
      return;
    }
    try {
      const done = await Promise.all(shots.slice(0, room).map(processImage));
      setImages((prev) => [...prev, ...done].slice(0, 2));
    } catch {
      setError("Could not read that image.");
    }
  };

  const onPaste = (e) => {
    const items =
      e.clipboardData && e.clipboardData.items ? Array.from(e.clipboardData.items) : [];
    const files = items
      .filter((it) => it.type && it.type.startsWith("image/"))
      .map((it) => it.getAsFile())
      .filter(Boolean);
    if (files.length) {
      e.preventDefault();
      addImages(files);
    }
  };

  // extra carries the just-pushed user turn: state setters flush async, so the
  // ref mirror may not include it yet — without this the request can go out
  // with no user message at all (Cohere 400).
  const runStream = async (id, model, extra) => {
    const controller = new AbortController();
    abortRef.current = controller;
    pendingRef.current = "";
    setStreaming(true);
    setError("");
    pushMessages(id, (msgs) => [...msgs, { role: "assistant", content: "" }]);
    try {
      const t0 = threadsRef.current.find((x) => x.id === id);
      const extraIsFirst = extra && !(t0 && t0.messages.some((m) => m.role === "user"));
      await streamCodinoMessage({
        messages: [
          ...historyFor(id),
          ...(extra ? [toApiUser(extra.content, extra.images, baseContext(), extraIsFirst)] : []),
        ],
        model: model || CODINO_MODEL,
        signal: controller.signal,
        onToken: (piece) => {
          pendingRef.current += piece;
          scheduleFlush(id);
        },
      });
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      if (pendingRef.current) {
        const rest = pendingRef.current;
        pendingRef.current = "";
        pushMessages(id, (msgs) => {
          if (msgs.length === 0) return msgs;
          const last = msgs[msgs.length - 1];
          return [...msgs.slice(0, -1), { ...last, content: last.content + rest }];
        });
      }
    } catch (e) {
      if (e && e.name === "AbortError") {
        pushMessages(id, (msgs) => {
          if (msgs.length === 0) return msgs;
          const last = msgs[msgs.length - 1];
          const content = last.content || "Stopped.";
          return [...msgs.slice(0, -1), { ...last, content }];
        });
      } else {
        const msg = (e && e.message) || "Codino hiccuped. Try again.";
        setError(msg);
        pushMessages(id, (msgs) => msgs.slice(0, -1));
      }
    } finally {
      abortRef.current = null;
      setStreaming(false);
    }
  };

  const send = async (text) => {
    const clean = String(text || "").trim();
    const shots = images;
    if ((!clean && !shots.length) || streaming || !active) return;
    stopSpeaking();
    if (!configured) {
      setError("Codino is not configured. Set VITE_ZYNQ_URL and VITE_ZYNQ_SECRET in .env (and Netlify) then rebuild.");
      return;
    }
    const id = active.id;
    pushMessages(id, (msgs) => [
      ...msgs,
      { role: "user", content: clean, images: shots.length ? shots : undefined },
    ]);
    setInput("");
    setImages([]);
    autoresize();
    stickRef.current = true;
    setStuck(true);
    await runStream(id, shots.length ? VISION_ALIAS : CODINO_MODEL, {
      content: clean,
      images: shots.length ? shots : undefined,
    });
  };

  const retry = async () => {
    if (!active || streaming) return;
    const msgs = active.messages;
    if (msgs.length === 0 || msgs[msgs.length - 1].role !== "user") return;
    if (!configured) {
      setError("Codino is not configured. Set VITE_ZYNQ_URL and VITE_ZYNQ_SECRET in .env (and Netlify) then rebuild.");
      return;
    }
    const last = msgs[msgs.length - 1];
    await runStream(active.id, last.images && last.images.length ? VISION_ALIAS : CODINO_MODEL);
  };

  const startNew = () => {
    const base = ctx?.q
      ? buildQuestionContext({ testData: ctx.testData, q: ctx.q, pickedLetter: ctx.pickedLetter, letters: ctx.letters, reveal: ctx.reveal })
      : generalContext(ctx?.testData.section);
    const fresh = makeThread({ title: base.title, testId: ctx?.testData.id || null, qn: ctx?.q?.n ?? null });
    setThreads((prev) => {
      const next = [fresh, ...prev];
      persistThreads(next);
      return next;
    });
    setActiveId(fresh.id);
  };

  if (!open) return null;
  const chips = ctx?.q
    ? buildQuestionContext({ testData: ctx.testData, q: ctx.q, pickedLetter: ctx.pickedLetter, letters: ctx.letters, reveal: ctx.reveal }).chips
    : generalContext(ctx?.testData.section).chips;

  const panel = (
    <div
      className={modal ? "cod-modal" : "cod-rail"}
      role="dialog"
      aria-label="Codino AI tutor"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="cod-head-clean">
        <span className="cod-brand-clean">
          <CodinoMascot size={26} mood={streaming ? "thinking" : "idle"} />
          Codino
        </span>
        <span className="cod-head-actions">
          {!narrow && (
            <button
              type="button"
              className="cod-ghost"
              onClick={onTogglePin}
              aria-pressed={pinned}
              title={pinned ? "Unpin panel" : "Pin panel to side"}
            >
              {pinned ? "Unpin" : "Pin"}
            </button>
          )}
          <button
            type="button"
            className="cod-ghost"
            onClick={() => setShowHistory((v) => !v)}
            aria-pressed={showHistory}
          >
            History
          </button>
          <button type="button" className="cod-ghost" onClick={startNew}>
            + New
          </button>
        </span>
        <button type="button" className="modal-close" aria-label="Close Codino" onClick={onClose}>
          ✕
        </button>
      </div>

      {showHistory && (
        <div className="cod-body">
          {threads.length === 0 && <p className="cod-empty">No chats yet. Ask something!</p>}
          {threads.map((t) => (
            <button
              key={t.id}
              type="button"
              className={t.id === activeId ? "cod-thread active" : "cod-thread"}
              onClick={() => {
                setActiveId(t.id);
                setShowHistory(false);
              }}
            >
              <span className="cod-thread-title">{t.title}</span>
              <span className="cod-thread-meta">
                {t.messages.length} msg{t.messages.length === 1 ? "" : "s"}
              </span>
            </button>
          ))}
        </div>
      )}

      {!showHistory && (
        <>
          <div className="cod-chat-wrap">
            <div className="cod-body cod-chat" ref={listRef} onScroll={onScrollList}>
            {messages.length === 0 && (
              <div className="cod-hero">
                <CodinoMascot size={88} mood={streaming ? "thinking" : "idle"} />
                <p className="cod-hero-title">How can I help?</p>
                <p className="cod-hero-sub">
                  {ctx?.q ? `Question ${ctx.q.n} · ${ctx.q.tag} — ask Codino anything!` : "Ask Codino any ACT question!"}
                </p>
                <div className="cod-chips cod-chips-center">
                  {chips.map((c) => (
                    <button key={c} type="button" className="cod-chip" onClick={() => send(c)}>
                      {c} <span aria-hidden="true">›</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="cod-msg cod-user">
                  <span className="cod-bubble">
                    {m.content ? renderAiText(m.content, passageStr) : null}
                    {m.images && m.images.length > 0 && (
                      <span className="cod-img-row">
                        {m.images.map((src, j) => (
                          <img key={j} src={src} alt={`Attached image ${j + 1}`} />
                        ))}
                      </span>
                    )}
                  </span>
                </div>
              ) : (
                <div key={i} className="cod-msg cod-ai">
                  <span className="cod-ai-head">
                    <CodinoMascot size={22} mood="idle" />
                    Codino
                    <span className="cod-spacer" />
                    <button
                      type="button"
                      className={speakingKey === `m${i}` ? "cod-speak speaking" : "cod-speak"}
                      onClick={() => speakMessage(`m${i}`, m.content)}
                      aria-label={speakingKey === `m${i}` ? "Stop reading aloud" : "Read aloud"}
                      title={speakingKey === `m${i}` ? "Stop" : "Read aloud"}
                      disabled={speakLoading === `m${i}`}
                    >
                      {speakLoading === `m${i}` ? (
                        <span className="cod-speak-spin" aria-hidden="true" />
                      ) : speakingKey === `m${i}` ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                          <rect x="2.5" y="2.5" width="9" height="9" rx="2" fill="currentColor" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                          <path
                            d="M2 6v4h3l4 3.5v-11L5 6H2z"
                            fill="currentColor"
                          />
                          <path
                            d="M11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.8a6 6 0 0 1 0 8.4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                    </button>
                  </span>
                  <div className="cod-ai-body">
                    {m.content ? (
                      renderAiText(
                        m.content,
                        passageStr,
                        answerOpts,
                        ctx?.testData?.section === "math" ? "From the question" : "From the passage"
                      )
                    ) : streaming && i === messages.length - 1 ? (
                      <span className="cod-typing" aria-label="Codino is typing"><span /><span /><span /></span>
                    ) : null}
                  </div>
                </div>
              )
            )}
            {error && (
              <div className="cod-error-row">
                <span className="cod-error">{error}</span>
                <button type="button" className="cod-retry" onClick={retry}>
                  Retry
                </button>
              </div>
            )}
            {!stuck && messages.length > 0 && (
              <>
                <div className="cod-fade-bottom" aria-hidden="true" />
                <button type="button" className="cod-newmsg" onClick={jumpDown}>
                  New messages
                  <span className="cod-newmsg-arrow" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 14 14">
                      <path
                        d="M7 2v9M3.8 7.8L7 11l3.2-3.2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
          <div className="cod-input-row">
            {dictOpen ? (
              <div className="cod-dictbox">
                <button
                  type="button"
                  className="cod-dict-x"
                  onClick={() => stopDictation(true)}
                  aria-label="Cancel dictation"
                  disabled={micBusy}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                    <path
                      d="M3 3l8 8M11 3l-8 8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <div className="cod-dict-wavewrap">
                  <canvas ref={dictCanvasRef} className="cod-dict-wave" width={320} height={40} aria-hidden="true" />
                  <p className="cod-dict-hint">{micBusy ? "Writing it down…" : !dictReady ? "Preparing mic…" : `Listening… ${dictSecs}s`}</p>
                </div>
                <button
                  type="button"
                  className="cod-send"
                    onClick={() => stopDictation(false)}
                    aria-label="Stop and insert dictation"
                    disabled={micBusy || !dictReady}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                    <rect x="2.5" y="2.5" width="9" height="9" rx="2" fill="currentColor" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
            <textarea
              ref={inputRef}
              className="cod-input"
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={onPaste}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask a question…"
              aria-label="Ask Codino a question"
              maxLength={1000}
            />
            {images.length > 0 && (
              <div className="cod-thumbs">
                {images.map((src, i) => (
                  <span key={i} className="cod-thumb">
                    <img src={src} alt={`Attached image ${i + 1}`} />
                    <button
                      type="button"
                      className="cod-thumb-x"
                      onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                      aria-label={`Remove image ${i + 1}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="cod-input-bar">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                aria-label="Attach an image"
                onChange={(e) => {
                  addImages(Array.from(e.target.files || []));
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                className="cod-attach"
                onClick={() => fileRef.current && fileRef.current.click()}
                aria-label="Attach an image"
                title="Attach an image"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    d="M8 3v10M3 8h10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <span className="cod-model-tag">Auto</span>
              <span className="cod-spacer" />
              <button
                type="button"
                className={recording ? "cod-mic recording" : "cod-mic"}
                onClick={openDictation}
                aria-label={recording ? "Stop dictation" : "Dictate with microphone"}
                title={recording ? "Stop dictation" : "Dictate"}
                disabled={micBusy || streaming}
              >
                {micBusy ? (
                  <span className="cod-speak-spin" aria-hidden="true" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <rect x="6" y="1.5" width="4" height="7.5" rx="2" fill="currentColor" />
                    <path
                      d="M3.5 7.5a4.5 4.5 0 0 0 9 0M8 12v2.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </button>
            {streaming ? (
              <button type="button" className="cod-send" onClick={stop} aria-label="Stop Codino">
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <rect x="3.5" y="3.5" width="9" height="9" rx="2" fill="currentColor" />
                </svg>
              </button>
            ) : input.trim() || images.length ? (
              <button type="button" className="cod-send" onClick={() => send(input)} aria-label="Send to Codino">
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path
                    d="M9 14.5v-11M4.8 7.3L9 3l4.2 4.3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : (
              <button type="button" className="cod-send cod-call-btn" onClick={() => setCallOpen(true)} aria-label="Call Codino">
                <svg width="17" height="17" viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    d="M3.2 2.2c.4-.4 1-.4 1.4 0l1.2 1.4c.3.4.3 1 0 1.4L5 5.9c.5 1.2 1.4 2.6 2.9 4.1 1 1 1.5 1.3 2 1.5l.7-.7c.4-.4 1-.4 1.4 0l1.5 1.5c.4.4.4 1 0 1.4l-.9.9c-.5.5-1.1.7-1.8.6-2.1-.3-4.4-1.9-6.6-4.1C2 9.4.6 7.1.3 5c-.1-.7.1-1.3.6-1.8l2.3-1z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            )}
            </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );

  if (modal) {
    return (
      <>
        <div className="cod-overlay" onClick={onClose}>
          {panel}
        </div>
        {callOpen && open && <CodinoCall context={ctx} onClose={() => setCallOpen(false)} />}
      </>
    );
  }
  return (
    <>
      {panel}
      {callOpen && open && <CodinoCall context={ctx} onClose={() => setCallOpen(false)} />}
    </>
  );
}
