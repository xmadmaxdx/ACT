import { useEffect, useRef, useState } from "react";
import "./ai.css";

const PLACEHOLDERS = [
  "Ask about loops…",
  "Why is my function crashing?",
  "Quiz me on strings…",
  "Explain recursion simply…",
];

const SUGGESTIONS = [
  {
    id: "loops",
    title: "Explain loops",
    sub: "for & while, simply",
    tile: "t-blue",
    text: "Explain for and while loops like I'm 5",
    glyph: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 2l4 4-4 4" />
        <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
        <path d="M7 22l-4-4 4-4" />
        <path d="M21 13v1a4 4 0 0 1-4 4H3" />
      </svg>
    ),
  },
  {
    id: "quiz",
    title: "Quiz me",
    sub: "strings checkpoint",
    tile: "t-purple",
    text: "Quiz me on Python strings",
    glyph: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9.2" />
        <path d="M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.7-2.4 2.1-2.4 3.6" />
        <circle cx="12" cy="17" r="0.4" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "fix",
    title: "Fix my code",
    sub: "paste the error",
    tile: "t-amber",
    text: "Help me fix this error: ",
    glyph: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14.5 6.5a4 4 0 0 0-5.6 5L4 16.4V20h3.6l4.9-4.9a4 4 0 0 0 5-5.6l-2.7 2.7-2.4-2.4z" />
      </svg>
    ),
  },
  {
    id: "challenge",
    title: "Challenge",
    sub: "today's pickup",
    tile: "t-green",
    text: "Give me a Python challenge",
    glyph: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
        <path d="M7 6H4a2 2 0 0 0 2 5h1M17 6h3a2 2 0 0 1-2 5h-1" />
      </svg>
    ),
  },
];

function BurgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M4 12h10" />
      <circle cx="18.5" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <path d="M4 17h13" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4z" />
      <path d="M19 15l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" opacity="0.7" />
    </svg>
  );
}

function ChevIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 3.5L10.2 14.3" />
      <path d="M21 3.5L14.4 21l-4.2-6.7L3.5 10z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}

export default function Ai() {
  const [text, setText] = useState("");
  const [phIdx, setPhIdx] = useState(0);
  const [listening, setListening] = useState(false);
  const inputRef = useRef(null);
  const listenT = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setPhIdx((i) => (i + 1) % PLACEHOLDERS.length), 2800);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => () => window.clearTimeout(listenT.current), []);

  const canSend = text.trim().length > 0;

  const pickSuggestion = (s) => {
    setText(s.text);
    inputRef.current?.focus();
  };

  const toggleListen = () => {
    if (listening) {
      window.clearTimeout(listenT.current);
      setListening(false);
      return;
    }
    setListening(true);
    listenT.current = window.setTimeout(() => setListening(false), 2600);
  };

  const send = () => {
    if (!canSend) return;
    setText("");
    inputRef.current?.focus();
  };

  return (
    <div className="ai-wrap">
      <div className="ai-topbar rise">
        <button type="button" className="ai-burger" aria-label="Menu">
          <BurgerIcon />
        </button>
        <button type="button" className="ai-model" aria-label="Model: Auto">
          <SparkIcon />
          <span>Auto</span>
          <ChevIcon />
        </button>
        <button type="button" className="ai-new" aria-label="New chat">
          <EditIcon />
        </button>
      </div>

      <div className="ai-main">
        <div className="ai-logo rise d1" aria-hidden="true">
          <svg width="76" height="76" viewBox="0 0 200 200" role="img" aria-label="Codino mark">
            <circle cx="100" cy="90" r="72" fill="#38A8FF" stroke="#1463AC" strokeWidth="8" />
            <ellipse cx="80" cy="80" rx="20" ry="24" fill="#fff" />
            <ellipse cx="122" cy="80" rx="20" ry="24" fill="#fff" />
            <circle cx="83" cy="85" r="10" fill="#0C2340" />
            <circle cx="119" cy="85" r="10" fill="#0C2340" />
            <path d="M 88 114 Q 101 124, 117 113" fill="none" stroke="#0C2340"
                  strokeWidth="9" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="ai-hello rise d2">Hey, let's learn <span>Python</span></h2>
        <p className="ai-sub rise d2">Ask anything — loops, errors, ideas, quizzes.</p>

        <div className="ai-grid">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`ai-card rise d${Math.min(i + 1, 4)}`}
              style={{ animationDelay: `${0.15 + i * 0.07}s` }}
              onClick={() => pickSuggestion(s)}
            >
              <span className={`ai-tile ${s.tile}`} aria-hidden="true">{s.glyph}</span>
              <span className="ai-card-title">{s.title}</span>
              <span className="ai-card-sub">{s.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="ai-dock rise d4">
        {listening && <p className="ai-listening">Listening… speak now</p>}
        <div className="ai-composer">
          <input
            ref={inputRef}
            className="ai-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            aria-label="Ask the AI"
            maxLength={500}
          />
          {text.length === 0 && (
            <span className="ai-ph" aria-hidden="true" key={phIdx}>{PLACEHOLDERS[phIdx]}</span>
          )}
          <button
            type="button"
            className={listening ? "ai-mic on" : "ai-mic"}
            onClick={toggleListen}
            aria-label={listening ? "Stop listening" : "Voice input"}
            aria-pressed={listening}
          >
            <MicIcon />
            {listening && <span className="ai-waves" aria-hidden="true"><i /><i /><i /></span>}
          </button>
          <button
            type="button"
            className={canSend ? "ai-send on" : "ai-send"}
            onClick={send}
            disabled={!canSend}
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
