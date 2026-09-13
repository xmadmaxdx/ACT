// Codino AI panel — pinned right rail + unpinned floating modal.
// TestScreen owns open/context; everything else (tabs, threads, streaming)
// lives here. AI text renders as plain text only — never HTML.

import { useEffect, useMemo, useRef, useState } from "react";
import "./codino.css";
import CodinoMascot from "./mascot.jsx";
import { isCodinoConfigured, streamCodinoMessage, VISION_MODEL, CODINO_MODEL } from "./zynq.js";
import {
  ASK_SYSTEM,
  EXPLAIN_SYSTEM,
  FORMAT_CONTRACT,
  buildQuestionContext,
  generalContext,
  passageText,
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
      ? buildQuestionContext({ testData: ctx.testData, q: ctx.q, pickedLetter: ctx.pickedLetter, letters: ctx.letters })
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

  useEffect(
    () => () => {
      if (abortRef.current) abortRef.current.abort();
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    },
    []
  );

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
  // content far more reliably. Every user message carries the full passage +
  // question block; stored threads stay clean for display.
  const baseContext = () =>
    ctx?.q
      ? buildQuestionContext({ testData: ctx.testData, q: ctx.q, pickedLetter: ctx.pickedLetter, letters: ctx.letters })
      : generalContext(ctx?.testData?.section);

  const toApiUser = (content, images, base) => {
    const text = `${base.contextText}\n\n${content || ""}`;
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
    const sys = `${ctx?.q ? EXPLAIN_SYSTEM : ASK_SYSTEM}\n\n${FORMAT_CONTRACT}`;
    const t = threadsRef.current.find((x) => x.id === id);
    const prior = (t ? t.messages : []).map((m) => {
      if (m.role !== "user") return { role: m.role, content: m.content };
      return toApiUser(m.content, m.images, base);
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
      await streamCodinoMessage({
        messages: [
          ...historyFor(id),
          ...(extra ? [toApiUser(extra.content, extra.images, baseContext())] : []),
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
    await runStream(id, shots.length ? VISION_MODEL : CODINO_MODEL, {
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
    await runStream(active.id, last.images && last.images.length ? VISION_MODEL : CODINO_MODEL);
  };

  const startNew = () => {
    const base = ctx?.q
      ? buildQuestionContext({ testData: ctx.testData, q: ctx.q, pickedLetter: ctx.pickedLetter, letters: ctx.letters })
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
    ? buildQuestionContext({ testData: ctx.testData, q: ctx.q, pickedLetter: ctx.pickedLetter, letters: ctx.letters }).chips
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
                  </span>
                  <div className="cod-ai-body">
                    {m.content ? (
                      renderAiText(m.content, passageStr)
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
            {streaming ? (
              <button type="button" className="cod-send" onClick={stop} aria-label="Stop Codino">
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <rect x="3.5" y="3.5" width="9" height="9" rx="2" fill="currentColor" />
                </svg>
              </button>
            ) : (
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
            )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (modal) {
    return (
      <div className="cod-overlay" onClick={onClose}>
        {panel}
      </div>
    );
  }
  return panel;
}
