// Codino AI panel — pinned right rail + unpinned floating modal.
// TestScreen owns open/context; everything else (tabs, threads, streaming)
// lives here. AI text renders as plain text only — never HTML.

import { useEffect, useMemo, useRef, useState } from "react";
import "./codino.css";
import CodinoMascot from "./mascot.jsx";
import { isCodinoConfigured, streamCodinoMessage } from "./zynq.js";
import {
  ASK_SYSTEM,
  EXPLAIN_SYSTEM,
  buildExplanation,
  buildQuestionContext,
  generalContext,
} from "./prompts.js";
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

export default function CodinoPanel({ open, defaultPinned, context, onClose }) {
  const narrow = useNarrow();
  const [pinned, setPinned] = useState(!!defaultPinned);
  const [tab, setTab] = useState("ask");
  const [threads, setThreads] = useState(() => loadThreads());
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [configured] = useState(() => isCodinoConfigured());
  const abortRef = useRef(null);
  const frameRef = useRef(null);
  const pendingRef = useRef("");
  const listRef = useRef(null);
  const stickRef = useRef(true);

  useEffect(() => {
    setPinned(!!defaultPinned && !narrow);
  }, [defaultPinned, narrow]);

  const ctx = context || null;
  const key = contextKey(ctx);
  const explain = useMemo(
    () => (ctx && ctx.q ? buildExplanation({ q: ctx.q, pickedLetter: ctx.pickedLetter, letters: ctx.letters }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ctx?.testData?.id ?? null, ctx?.q?.n ?? null, ctx?.pickedLetter ?? null]
  );

  // Adopt a thread for this question (or general) whenever the panel opens.
  useEffect(() => {
    if (!open) return;
    setTab(ctx && ctx.tab ? ctx.tab : "ask");
    setError("");
    setThreads((prev) => {
      const hit = prev.find((t) => t.testId === (ctx?.testData.id || null) && (t.qn ?? null) === (ctx?.q?.n ?? null));
      if (hit) {
        setActiveId(hit.id);
        return prev;
      }
      const base = ctx?.q
        ? buildQuestionContext({ testData: ctx.testData, q: ctx.q, pickedLetter: ctx.pickedLetter, letters: ctx.letters })
        : generalContext(ctx?.testData.section);
      const fresh = makeThread({ title: base.title, testId: ctx?.testData.id || null, qn: ctx?.q?.n ?? null });
      const next = [fresh, ...prev];
      persistThreads(next);
      setActiveId(fresh.id);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, key]);

  const active = threads.find((t) => t.id === activeId) || null;
  const messages = active ? active.messages : [];

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
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  };

  useEffect(() => {
    const el = listRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages.length, messages.length > 0 ? messages[messages.length - 1].content.length : 0]);

  const systemFor = () => (ctx?.q ? EXPLAIN_SYSTEM : ASK_SYSTEM);

  const historyFor = (extraUser) => {
    const base = ctx?.q
      ? buildQuestionContext({ testData: ctx.testData, q: ctx.q, pickedLetter: ctx.pickedLetter, letters: ctx.letters })
      : generalContext(ctx?.testData.section);
    const prior = (active ? active.messages : []).map((m) => ({ role: m.role, content: m.content }));
    return [
      { role: "system", content: `${systemFor()}\n\n${base.contextText}` },
      ...prior,
      ...(extraUser ? [{ role: "user", content: extraUser }] : []),
    ];
  };

  const runStream = async (id, userText) => {
    const controller = new AbortController();
    abortRef.current = controller;
    pendingRef.current = "";
    setStreaming(true);
    setError("");
    pushMessages(id, (msgs) => [...msgs, { role: "assistant", content: "" }]);
    try {
      await streamCodinoMessage({
        messages: historyFor(userText),
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
    if (!clean || streaming || !active) return;
    if (!configured) {
      setError("Codino is not configured. Set VITE_ZYNQ_URL and VITE_ZYNQ_SECRET in .env (and Netlify) then rebuild.");
      return;
    }
    const id = active.id;
    pushMessages(id, (msgs) => [...msgs, { role: "user", content: clean }]);
    setInput("");
    stickRef.current = true;
    await runStream(id, clean);
  };

  const retry = async () => {
    if (!active || streaming) return;
    const msgs = active.messages;
    if (msgs.length === 0 || msgs[msgs.length - 1].role !== "user") return;
    if (!configured) {
      setError("Codino is not configured. Set VITE_ZYNQ_URL and VITE_ZYNQ_SECRET in .env (and Netlify) then rebuild.");
      return;
    }
    await runStream(active.id, null);
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
    setTab("ask");
  };

  if (!open) return null;
  const modal = !pinned;
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
      <div className="cod-head">
        <span className="cod-pin-wrap">
          {!narrow && (
            <button
              type="button"
              className="cod-pin"
              onClick={() => setPinned((p) => !p)}
              aria-pressed={pinned}
              title={pinned ? "Unpin panel" : "Pin panel to side"}
            >
              <span className={pinned ? "cod-checkbox on" : "cod-checkbox"} aria-hidden="true" />
              {pinned ? "Pinned" : "Pin to side"}
            </button>
          )}
        </span>
        <button type="button" className="modal-close" aria-label="Close Codino" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="cod-tabs" role="tablist" aria-label="Codino views">
        <div className="cod-tabs-row">
          <span className="cod-brand" aria-hidden="true">
            <CodinoMascot size={22} mood={streaming ? "thinking" : "idle"} />
            Ask Codino
          </span>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "ask"}
            className={tab === "ask" ? "cod-tab active" : "cod-tab"}
            onClick={() => setTab("ask")}
          >
            Ask
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "explain"}
            className={tab === "explain" ? "cod-tab active" : "cod-tab"}
            onClick={() => setTab("explain")}
            disabled={!explain}
            title={explain ? "Official explanation" : "Open from a question to see its explanation"}
          >
            Explanation
          </button>
        </div>
        <div className="cod-tabs-row">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "history"}
            className={tab === "history" ? "cod-tab active" : "cod-tab"}
            onClick={() => setTab("history")}
          >
            <span aria-hidden="true">◷</span> History
          </button>
          <button type="button" className="cod-new" onClick={startNew}>
            + New
          </button>
        </div>
      </div>

      {tab === "explain" && explain && (
        <div className="cod-body">
          <div className="cod-verdict-row">
            <span
              className={
                explain.verdict === "correct"
                  ? "cod-verdict good"
                  : explain.verdict === "wrong"
                    ? "cod-verdict bad"
                    : "cod-verdict neutral"
              }
            >
              {explain.verdict === "correct"
                ? "You nailed it"
                : explain.verdict === "wrong"
                  ? `You picked ${ctx.pickedLetter} — correct is ${ctx.q.answer}`
                  : "Not answered yet"}
            </span>
          </div>
          <div className="cod-opt-list">
            {explain.options.map((o) => (
              <div key={o.letter} className={`cod-opt cod-opt-${o.state}`}>
                <span className="q-letter">{o.letter}</span>
                <span className="cod-opt-text">{o.text}</span>
                {o.state === "correct" && <span className="cod-opt-flag">correct</span>}
                {o.state === "picked" && <span className="cod-opt-flag">yours</span>}
              </div>
            ))}
          </div>
          <p className="cod-rule">{explain.rule}</p>
          <div className="cod-chips">
            {chips.map((c) => (
              <button key={c} type="button" className="cod-chip" onClick={() => { setTab("ask"); send(c); }}>
                {c} <span aria-hidden="true">›</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="cod-body">
          {threads.length === 0 && <p className="cod-empty">No chats yet. Ask something!</p>}
          {threads.map((t) => (
            <button
              key={t.id}
              type="button"
              className={t.id === activeId ? "cod-thread active" : "cod-thread"}
              onClick={() => {
                setActiveId(t.id);
                setTab("ask");
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

      {tab === "ask" && (
        <>
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
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "cod-msg cod-user" : "cod-msg cod-ai"}>
                {m.role === "assistant" && (
                  <span className="cod-ai-dot" aria-hidden="true">
                    <CodinoMascot size={26} mood="idle" />
                  </span>
                )}
                <span className="cod-bubble">
                  {m.content || (streaming && i === messages.length - 1 ? <span className="cod-typing" aria-label="Codino is typing"><span /><span /><span /></span> : null)}
                </span>
              </div>
            ))}
            {error && (
              <div className="cod-error-row">
                <span className="cod-error">{error}</span>
                <button type="button" className="cod-retry" onClick={retry}>
                  Retry
                </button>
              </div>
            )}
          </div>
          <div className="cod-input-row">
            <input
              className="cod-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
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
            {streaming ? (
              <button type="button" className="cod-send cod-stop" onClick={stop} aria-label="Stop Codino">
                ■
              </button>
            ) : (
              <button
                type="button"
                className="cod-send"
                onClick={() => send(input)}
                disabled={!input.trim()}
                aria-label="Send to Codino"
              >
                ↑
              </button>
            )}
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
