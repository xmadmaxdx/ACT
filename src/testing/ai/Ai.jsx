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

const AI_INTRO =
  "Great pick — functions are where Python starts feeling like magic. " +
  "You pack a few lines into a name, then call that name whenever you want the job done. " +
  "Here's the smallest version that actually works:";
const AI_CODE = 'def greet(name):\n    return f"Hello, {name}!"';
const AI_SNIPPET = "$ python greet.py\nHello, Ada!";
const AI_OUTRO =
  'Run it and greet("Ada") hands back "Hello, Ada!". The f-string pastes the name right into ' +
  "the sentence — no plus signs, no gaps to forget. Once this clicks, try calling it three times " +
  "with three different names and watch it never break a sweat.";
const INLINE_FOLLOW = {
  label: "find free Python speaking drills",
  send: "Find me free Python speaking drills with instant feedback",
};
const AI_BULLETS = [
  "Call it with any name — it just works",
  "f-strings beat plus-sign joining every time",
  "return hands the result straight back to you",
];
const AI_TABLE = {
  head: ["Method", "Does", "Try"],
  rows: [
    [".upper()", "SHOUTS", '"hi" → "HI"'],
    [".strip()", "Trims edges", '" hi " → "hi"'],
    [".split(\",\")", "Cuts apart", '"a,b" → ["a", "b"]'],
  ],
};
const AI_QUIZ = {
  q: 'What does greet("Ada") return?',
  options: ['"Hello, Ada!"', '"Hello, name!"', '"Ada, Hello!"'],
  answer: 0,
  explain: 'The f-string swaps {name} for "Ada" — exactly what you passed in.',
};
const AI_INTRO2 = "Pop quiz time — two quick taps, no pressure. Wrong answers teach just as much:";
const AI_OUTRO2 = "Finished both? Then the idea is yours — functions take in, hand back, never fuss.";
const AI_QUIZ_B = {
  q: "Which line actually runs the function?",
  options: ['def greet(name):', 'greet("Ada")', 'return f"..."'],
  answer: 1,
  explain: "def only defines it — the call greet(\"Ada\") is what runs it.",
};
const FOLLOWUPS = ["Explain each line", "Give me a challenge"];
const MENU_TIME = "Today, 11:01 AM";

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
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5M5 12l7-7 7 7" />
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

function CopyIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="11.5" height="11.5" rx="2.5" />
      <path d="M5.5 15h-1a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 12.5l5 5L19.5 7" />
    </svg>
  );
}

function SpeakerIcon({ on }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5L6.5 9H3v6h3.5L11 19z" fill={on ? "currentColor" : "none"} />
      <path d="M15 9a4.2 4.2 0 0 1 0 6M17.8 6.8a7.4 7.4 0 0 1 0 10.4" />
    </svg>
  );
}

function LikeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 10.5V21M7 10.5l4.2-7.3c.9 0 1.7.7 1.7 1.7v4.3h5.5a2 2 0 0 1 2 2.4l-1.3 6.4a2 2 0 0 1-2 1.5H7" />
    </svg>
  );
}

function DislikeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 13.5V3M17 13.5l-4.2 7.3c-.9 0-1.7-.7-1.7-1.7v-4.3H5.6a2 2 0 0 1-2-2.4l1.3-6.4a2 2 0 0 1 2-1.5H17" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="17.5" cy="5.5" r="2.6" />
      <circle cx="17.5" cy="18.5" r="2.6" />
      <path d="M8.3 10.8l6.9-4M8.3 13.2l6.9 4" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function BranchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="6" r="2.4" />
      <circle cx="6" cy="18" r="2.4" />
      <circle cx="18" cy="12" r="2.4" />
      <path d="M6 8.4v7.2M8 7c4 0 3 3.4 7.6 3.9" />
    </svg>
  );
}

function RetryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 8a9 9 0 0 1 15.9-1.5L21 8" />
      <path d="M21 3.5V8h-4.5" />
      <path d="M20.5 16a9 9 0 0 1-15.9 1.5L3 16" />
      <path d="M3 20.5V16h4.5" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 21V4" />
      <path d="M5 4.5h12.5l-2.5 4 2.5 4H5" />
    </svg>
  );
}

function IdeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 4h6v6" />
      <path d="M20 4L11 13" />
      <path d="M19 13.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" strokeDasharray="3.5 3" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13.5" r="3.4" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M4.5 17.5l4.5-4.5 3 3 3.5-3.5 4 4" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c-4.8 4.9-4.8 12.1 0 17M12 3.5c4.8 4.9 4.8 12.1 0 17" />
    </svg>
  );
}

const RECENTS = [
  { id: "r1", title: "Loops explained simply" },
  { id: "r2", title: "String slicing help" },
  { id: "r3", title: "Fix: index out of range" },
  { id: "r4", title: "Recursion quiz night" },
  { id: "r5", title: "Challenge #12 attempt" },
  { id: "r6", title: "f-strings practice" },
  { id: "r7", title: "Variables 101 recap" },
];

function CodinoMark({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" role="img" aria-label="Codino mark">
      <circle cx="100" cy="90" r="72" fill="#38A8FF" stroke="#1463AC" strokeWidth="8" />
      <ellipse cx="80" cy="80" rx="20" ry="24" fill="#fff" />
      <ellipse cx="122" cy="80" rx="20" ry="24" fill="#fff" />
      <circle cx="83" cy="85" r="10" fill="#0C2340" />
      <circle cx="119" cy="85" r="10" fill="#0C2340" />
      <path d="M 88 114 Q 101 124, 117 113" fill="none" stroke="#0C2340" strokeWidth="9" strokeLinecap="round" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function AiCode({ copied, onCopy }) {
  return (
    <div className="ai-code">
      <div className="ai-code-head">
        <span className="ai-lang">PYTHON</span>
        <button type="button" className="ai-iconbtn" onClick={onCopy} aria-label={copied ? "Copied" : "Copy code"}>
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
      <pre className="ai-pre">
        <code>
          <span className="tk-k">def </span><span className="tk-f">greet</span><span className="tk-p">(name):</span>{'\n'}
          <span className="tk-p">    </span><span className="tk-k">return </span><span className="tk-k">f</span><span className="tk-s">"Hello, {'{name}'}!"</span>
        </code>
      </pre>
      <button type="button" className="ai-ide">
        <IdeIcon /> Open in IDE
      </button>
    </div>
  );
}

function AiSnippet({ text, copied, onCopy }) {
  return (
    <div className="ai-snippet">
      <button type="button" className="ai-snipcopy" onClick={onCopy} aria-label={copied ? "Copied" : "Copy snippet"}>
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
      <pre className="ai-snippre">
        <code>{text}</code>
      </pre>
    </div>
  );
}

function AiBullets({ items }) {
  return (
    <ul className="ai-bullets">
      {(items || []).map((b, i) => (
        <li key={i}>{b}</li>
      ))}
    </ul>
  );
}

function AiTable({ head, rows }) {
  return (
    <div className="ai-tablewrap" role="table" aria-label="String methods">
      <div className="ai-tr head" role="row">
        {(head || []).map((h) => (
          <span className="ai-td" role="columnheader" key={h}>{h}</span>
        ))}
      </div>
      {(rows || []).map((r, i) => (
        <div className="ai-tr" role="row" key={i}>
          {r.map((c, j) => (
            <span className={j === 0 ? "ai-td mono" : "ai-td"} role="cell" key={j}>{c}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

function AiFollow({ mode, onInline, onChip }) {
  if (mode === "inline") {
    return (
      <p className="ai-text">
        If you want, I can{" "}
        <button type="button" className="ai-inline" onClick={onInline}>
          ↳ {INLINE_FOLLOW.label}
        </button>{" "}
        — just tap it.
      </p>
    );
  }
  return (
    <div className="ai-follow">
      {FOLLOWUPS.map((f) => (
        <button key={f} type="button" className="ai-chip" onClick={() => onChip(f)}>
          {f}
        </button>
      ))}
    </div>
  );
}
function AiQuiz({ data, qkey }) {
  const [pick, setPick] = useState(null);
  const done = pick !== null;
  return (
    <div className="ai-quiz" key={qkey}>
      <p className="ai-quiz-q">{data.q}</p>
      <div className="ai-quiz-opts">
        {data.options.map((o, i) => {
          const cls = !done ? "ai-opt" : i === data.answer ? "ai-opt correct" : i === pick ? "ai-opt wrong" : "ai-opt dim";
          return (
            <button key={o} type="button" className={cls} disabled={done} onClick={() => setPick(i)}>
              <span className="ai-opt-letter" aria-hidden="true">{["A", "B", "C"][i]}</span>
              {o}
              {done && i === data.answer && <span className="ai-opt-mark" aria-hidden="true"><CheckIcon /></span>}
            </button>
          );
        })}
      </div>
      {done && <p className={pick === data.answer ? "ai-quiz-why ok" : "ai-quiz-why no"}>{data.explain}</p>}
    </div>
  );
}

export default function Ai() {
  const [text, setText] = useState("");
  const [phIdx, setPhIdx] = useState(0);
  const [listening, setListening] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [levels, setLevels] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [menuFor, setMenuFor] = useState(null);
  const [sheet, setSheet] = useState(false);
  const [webOn, setWebOn] = useState(false);
  const [attach, setAttach] = useState(null);
  const [vote, setVote] = useState({});
  const [codeCopied, setCodeCopied] = useState(false);
  const [snipCopied, setSnipCopied] = useState(false);
  const [msgCopied, setMsgCopied] = useState(null);
  const [speaking, setSpeaking] = useState(null);
  const [shared, setShared] = useState(null);
  const [reported, setReported] = useState({});
  const inputRef = useRef(null);
  const threadRef = useRef(null);
  const genRef = useRef(0);
  const flipRef = useRef(false);
  const countRef = useRef(0);
  const timers = useRef([]);
  const ivs = useRef([]);

  const later = (fn, ms) => {
    const t = window.setTimeout(fn, ms);
    timers.current.push(t);
  };

  useEffect(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    ivs.current.forEach((i) => window.clearInterval(i));
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setPhIdx((i) => (i + 1) % PLACEHOLDERS.length), 2800);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!listening) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLevels([8, 14, 20, 12, 22, 16, 10, 18, 24, 14, 8, 20]);
      return;
    }
    const tick = window.setInterval(() => {
      const sec = Date.now() / 1000;
      const speakingNow = sec % 3 < 2;
      const h = speakingNow ? 6 + Math.round(Math.random() * 22) : 2 + Math.round(Math.random() * 3);
      setLevels((prev) => [...prev.slice(-27), h]);
    }, 130);
    return () => window.clearInterval(tick);
  }, [listening]);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  const canSend = text.trim().length > 0 || !!attach;

  const runReply = (userText, echo = true, hasPhoto = false) => {
    const gen = ++genRef.current;
    const stamp = Date.now();
    const aiId = `a${stamp}`;
    const follow = flipRef.current ? "chips" : "inline";
    flipRef.current = !flipRef.current;
    const variant = countRef.current % 2 === 1 ? "quiz" : "standard";
    countRef.current += 1;
    const intro = variant === "quiz" ? AI_INTRO2 : AI_INTRO;
    if (echo) setMsgs((m) => [...m, { id: `u${stamp}`, role: "user", text: userText, photo: hasPhoto }]);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMsgs((m) => [...m, { id: aiId, role: "ai", stage: "done", text: intro, follow, variant }]);
      return;
    }
    setMsgs((m) => [...m, { id: aiId, role: "ai", stage: "thinking", text: "", follow, variant }]);
    later(() => {
      if (genRef.current !== gen) return;
      setMsgs((m) => m.map((x) => (x.id === aiId ? { ...x, stage: "streaming" } : x)));
      let i = 0;
      const iv = window.setInterval(() => {
        if (genRef.current !== gen) {
          window.clearInterval(iv);
          return;
        }
        i += 2;
        const done = i >= intro.length;
        const slice = intro.slice(0, i);
        setMsgs((m) => m.map((x) => (x.id === aiId ? { ...x, text: slice, stage: done ? "code" : "streaming" } : x)));
        if (done) {
          window.clearInterval(iv);
          later(() => {
            if (genRef.current !== gen) return;
            setMsgs((m) => m.map((x) => (x.id === aiId ? { ...x, stage: "done" } : x)));
          }, 450);
        }
      }, 24);
      ivs.current.push(iv);
    }, 900);
  };

  const pickSuggestion = (s) => {
    setText(s.text);
    inputRef.current?.focus();
  };

  const startListen = () => {
    setLevels([]);
    setListening(true);
  };

  const cancelListen = () => {
    setListening(false);
    setLevels([]);
  };

  const stopListen = () => {
    setListening(false);
    setLevels([]);
    setText("Explain for loops like I'm five");
    inputRef.current?.focus();
  };

  const send = () => {
    if (!canSend) return;
    runReply(text.trim() || "What's in this photo?", true, !!attach);
    setText("");
    setAttach(null);
    inputRef.current?.focus();
  };

  const addPhoto = (kind) => {
    setAttach(kind);
    setSheet(false);
    inputRef.current?.focus();
  };

  const newChat = () => {
    genRef.current += 1;
    countRef.current = 0;
    flipRef.current = false;
    setMsgs([]);
    setMenuFor(null);
  };

  const copyText = async (s) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(s);
      else throw new Error("no clipboard");
      return true;
    } catch (err) {
      window.console.debug("ai copy skipped", err);
      return false;
    }
  };

  const replyFull = (m) =>
    m.variant === "quiz"
      ? `${m.text}\n${AI_QUIZ.q}\n${AI_QUIZ_B.q}`
      : `${m.text}\n${AI_CODE}\n${AI_SNIPPET}\n${AI_OUTRO}`;

  const onCopyMsg = async (m) => {
    if (await copyText(replyFull(m))) {
      setMsgCopied(m.id);
      later(() => setMsgCopied((c) => (c === m.id ? null : c)), 1500);
    }
  };

  const onCopyCode = async () => {
    if (await copyText(AI_CODE)) {
      setCodeCopied(true);
      later(() => setCodeCopied(false), 1500);
    }
  };

  const onCopySnip = async () => {
    if (await copyText(AI_SNIPPET)) {
      setSnipCopied(true);
      later(() => setSnipCopied(false), 1500);
    }
  };

  const onShare = async (m) => {
    if (await copyText(replyFull(m))) {
      setShared(m.id);
      later(() => setShared((s) => (s === m.id ? null : s)), 1500);
    }
  };

  const toggleVote = (id, v) => {
    setVote((prev) => ({ ...prev, [id]: prev[id] === v ? null : v }));
  };

  const prevUserText = (aiId) => {
    const idx = msgs.findIndex((m) => m.id === aiId);
    const prev = [...msgs.slice(0, idx)].reverse().find((m) => m.role === "user");
    return prev ? prev.text : "Go on";
  };

  const onRetry = (aiId) => {
    const q = prevUserText(aiId);
    setMenuFor(null);
    setMsgs((m) => m.filter((x) => x.id !== aiId));
    later(() => runReply(q, false), 150);
  };

  const onBranch = (aiId) => {
    const q = prevUserText(aiId);
    setMenuFor(null);
    newChat();
    later(() => runReply(q), 150);
  };

  const chatting = msgs.length > 0;

  return (
    <div className={chatting ? "ai-wrap chatting" : "ai-wrap"}>
      <div className="ai-topbar rise">
        <button type="button" className="ai-burger" aria-label="Menu" aria-expanded={drawer} onClick={() => setDrawer(true)}>
          <BurgerIcon />
        </button>
        <button type="button" className="ai-model" aria-label="Model: Auto">
          <SparkIcon />
          <span>Auto</span>
          <ChevIcon />
        </button>
        <button type="button" className={chatting ? "ai-new plain" : "ai-new"} aria-label={chatting ? "Close chat" : "New chat"} onClick={newChat}>
          {chatting ? <XIcon /> : <EditIcon />}
        </button>
      </div>

      {!chatting ? (
      <div className="ai-main">
        <div className="ai-logo rise d1" aria-hidden="true">
          <CodinoMark size={76} />
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
      ) : (
      <div className="ai-main chatting">
        <div className="ai-thread" ref={threadRef}>
          {msgs.map((m) => m.role === "user" ? (
            <div className="ai-urow" key={m.id}>
              {m.photo && (
                <span className="ai-photo" aria-label="Attached photo">
                  <ImageIcon />
                </span>
              )}
              {!!m.text && <p className="ai-ububble">{m.text}</p>}
            </div>
          ) : (
            <div className="ai-msg" key={m.id}>
              {m.stage === "thinking" ? (
                <span className="ai-think" role="status" aria-label="Thinking">
                  <i /><i /><i />
                </span>
              ) : (
                <>
                  <p className="ai-text">
                    {m.text}
                    {m.stage === "streaming" && <span className="ai-caret" aria-hidden="true" />}
                  </p>
                  {(m.stage === "code" || m.stage === "done") && m.variant !== "quiz" && (
                    <AiCode copied={codeCopied} onCopy={onCopyCode} />
                  )}
                  {m.stage === "done" && m.variant !== "quiz" && (
                    <>
                      <AiSnippet text={AI_SNIPPET} copied={snipCopied} onCopy={onCopySnip} />
                      <p className="ai-text">
                        Run it and <span className="ai-hl y">greet("Ada")</span> hands back{" "}
                        <span className="ai-hl g">"Hello, Ada!"</span>. The{" "}
                        <span className="ai-hl b">f-string</span> pastes the name right into the sentence —
                        no plus signs, no gaps to forget. Once this clicks, try calling it three times with
                        three different names and watch it never break a sweat.
                      </p>
                      <AiBullets items={AI_BULLETS} />
                      <AiTable head={AI_TABLE.head} rows={AI_TABLE.rows} />
                      <AiFollow mode={m.follow} onInline={() => runReply(INLINE_FOLLOW.send)} onChip={(f) => runReply(f)} />
                    </>
                  )}
                  {m.stage === "done" && m.variant === "quiz" && (
                    <>
                      <AiQuiz data={AI_QUIZ} qkey={`${m.id}-a`} />
                      <AiQuiz data={AI_QUIZ_B} qkey={`${m.id}-b`} />
                      <p className="ai-text">{AI_OUTRO2}</p>
                      <AiFollow mode={m.follow} onInline={() => runReply(INLINE_FOLLOW.send)} onChip={(f) => runReply(f)} />
                    </>
                  )}
                  {m.stage === "done" && (
                      <div className="ai-actions">
                        <button
                          type="button"
                          className="ai-act"
                          onClick={() => onCopyMsg(m)}
                          aria-label={msgCopied === m.id ? "Copied" : "Copy response"}
                        >
                          {msgCopied === m.id ? <CheckIcon /> : <CopyIcon />}
                        </button>
                        <button
                          type="button"
                          className={speaking === m.id ? "ai-act on" : "ai-act"}
                          onClick={() => setSpeaking((s) => (s === m.id ? null : m.id))}
                          aria-label={speaking === m.id ? "Stop reading" : "Read aloud"}
                          aria-pressed={speaking === m.id}
                        >
                          <SpeakerIcon on={speaking === m.id} />
                        </button>
                        <button
                          type="button"
                          className={vote[m.id] === "up" ? "ai-act on" : "ai-act"}
                          onClick={() => toggleVote(m.id, "up")}
                          aria-label="Good response"
                          aria-pressed={vote[m.id] === "up"}
                        >
                          <LikeIcon />
                        </button>
                        <button
                          type="button"
                          className={vote[m.id] === "down" ? "ai-act on" : "ai-act"}
                          onClick={() => toggleVote(m.id, "down")}
                          aria-label="Bad response"
                          aria-pressed={vote[m.id] === "down"}
                        >
                          <DislikeIcon />
                        </button>
                        <button
                          type="button"
                          className="ai-act"
                          onClick={() => onShare(m)}
                          aria-label={shared === m.id ? "Link copied" : "Share response"}
                        >
                          {shared === m.id ? <CheckIcon /> : <ShareIcon />}
                        </button>
                        <button
                          type="button"
                          className="ai-act"
                          onClick={() => setMenuFor((f) => (f === m.id ? null : m.id))}
                          aria-label="More options"
                          aria-expanded={menuFor === m.id}
                        >
                          <DotsIcon />
                        </button>
                        {menuFor === m.id && (
                          <div className="ai-menu" role="menu" aria-label="Response options">
                            <p className="ai-menu-time">{MENU_TIME}</p>
                            <button type="button" className="ai-mi" onClick={() => onBranch(m.id)}>
                              <BranchIcon /> Branch in new chat
                            </button>
                            <hr />
                            <button type="button" className="ai-mi" onClick={() => onRetry(m.id)}>
                              <RetryIcon /> Retry
                            </button>
                            <button
                              type="button"
                              className="ai-mi"
                              disabled={!!reported[m.id]}
                              onClick={() => {
                                setReported((r) => ({ ...r, [m.id]: true }));
                                setMenuFor(null);
                              }}
                            >
                              {reported[m.id] ? <CheckIcon /> : <FlagIcon />}
                              {reported[m.id] ? "Reported ✓" : "Report response"}
                            </button>
                          </div>
                        )}
                      </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      )}

      <div className="ai-dock rise d4">
        {listening ? (
          <div className="ai-dictate">
            <button type="button" className="ai-dict-x" onClick={cancelListen} aria-label="Cancel dictation">
              <XIcon />
            </button>
            <div className="ai-dict-track" aria-hidden="true">
              <span className="ai-dots" />
              <span className="ai-bars">
                {levels.map((h, i) => (
                  <i key={i} style={{ height: `${h}px` }} />
                ))}
              </span>
              <span className="ai-dots end" />
            </div>
            <button type="button" className="ai-dict-stop" onClick={stopListen} aria-label="Stop and dictate">
              <span className="ai-stop-sq" aria-hidden="true" />
            </button>
          </div>
        ) : (
        <>
        {attach && (
          <div className="ai-attachprev">
            <span className="ai-attachthumb" aria-hidden="true">
              <ImageIcon />
            </span>
            <span className="ai-attachname">{attach === "camera" ? "camera-photo.jpg" : "upload-photo.jpg"}</span>
            <button type="button" className="ai-attachx" onClick={() => setAttach(null)} aria-label="Remove photo">
              <XIcon />
            </button>
          </div>
        )}
        <div className="ai-composer">
          {chatting && (
            <button type="button" className="ai-plus" onClick={() => setSheet(true)} aria-label="Attach">
              <PlusIcon />
            </button>
          )}
          <input
            ref={inputRef}
            className="ai-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            aria-label="Ask the AI"
            maxLength={500}
          />
          {text.length === 0 && !chatting && (
            <span className="ai-ph" aria-hidden="true" key={phIdx}>{PLACEHOLDERS[phIdx]}</span>
          )}
          <button
            type="button"
            className="ai-mic"
            onClick={startListen}
            aria-label="Voice input"
          >
            <MicIcon />
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
        </>
        )}
      </div>

      {menuFor && <div className="ai-catch" onClick={() => setMenuFor(null)} />}

      {sheet && (
        <div className="ai-sheet-scrim" onClick={() => setSheet(false)}>
          <div
            className="ai-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Attachments"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="ai-grab" aria-hidden="true" />
            <button type="button" className="ai-sheetrow" onClick={() => addPhoto("camera")}>
              <span className="ai-sheeticon b" aria-hidden="true"><CameraIcon /></span>
              <span className="ai-sheetlabel">Take picture</span>
            </button>
            <button type="button" className="ai-sheetrow" onClick={() => addPhoto("upload")}>
              <span className="ai-sheeticon g" aria-hidden="true"><ImageIcon /></span>
              <span className="ai-sheetlabel">Upload picture</span>
            </button>
            <div className="ai-sheetrow static">
              <span className="ai-sheeticon p" aria-hidden="true"><GlobeIcon /></span>
              <span className="ai-sheetlabel">Web search</span>
              <button
                type="button"
                role="switch"
                aria-checked={webOn}
                aria-label="Web search"
                className={webOn ? "ai-switch on" : "ai-switch"}
                onClick={() => setWebOn((w) => !w)}
              >
                <span className="ai-knob" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      {drawer && (
        <div className="ai-scrim" onClick={() => setDrawer(false)}>
          <div
            className="ai-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Recent chats"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ai-brand">
              <span className="ai-brand-name">Codino</span>
              <CodinoMark size={40} />
            </div>
            <p className="ai-recents">Recents</p>
            <div className="ai-chatlist">
              {RECENTS.map((c) => (
                <button key={c.id} type="button" className="ai-chat" onClick={() => setDrawer(false)}>
                  <span className="ai-dot" aria-hidden="true" />
                  <span className="ai-chat-title">{c.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
