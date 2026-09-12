import { useEffect, useRef, useState } from "react";
import MathText, { mathRich } from "./MathText.jsx";
import FreestyleBoard from "./FreestyleBoard.jsx";
import { lettersFor } from "../scoring.js";

const LETTERS = ["A", "B", "C", "D"];

/* Exact match first; otherwise the longest consecutive word-run of the quote
   present in the text (case-insensitive). Tolerates AI quote drift without
   highlighting an unrelated word. */
function findQuote(text, quote, from) {
  const full = String(text);
  const at = full.indexOf(String(quote), from);
  if (at >= 0) return [at, at + String(quote).length];
  const words = String(quote).trim().split(/\s+/);
  if (words.length < 2) return null;
  const region = full.toLowerCase().slice(from);
  for (let size = words.length - 1; size >= 2; size--) {
    for (let start = 0; start + size <= words.length; start++) {
      const frag = words.slice(start, start + size).join(" ");
      const i = region.indexOf(frag.toLowerCase());
      if (i >= 0) return [from + i, from + i + frag.length];
    }
  }
  return null;
}

/* Split a plain-text paragraph on the active question's refs plus the user's
   own highlights, painted in a single boundary sweep so overlaps blend.
   {para, text}      → highlight the exact quote (or best matching word-run)
   {para} (no text)  → highlight the whole paragraph
   {para, text: ""}  → tolerated, no highlight (avoids highlighting wrong words)
   userHits: [{s, e}] resolved offsets → mint user-mark (tap to remove);
   segments carrying both become ref-mark user-mark. */
function renderParaText(text, refs, userHits, onUnmark) {
  const full = String(text);
  const paraRefs = (refs || []).filter((r) => r && Number.isInteger(r.para));
  const refHits = [];
  if (paraRefs.some((r) => r.text == null)) {
    refHits.push([0, full.length]);
  } else {
    const live = paraRefs.filter((r) => typeof r.text === "string" && r.text.length > 0);
    live.forEach((r) => {
      let from = 0;
      for (;;) {
        const hit = findQuote(full, r.text, from);
        if (!hit) break;
        refHits.push(hit);
        from = hit[1];
      }
    });
  }
  const uh = (userHits || [])
    .filter((h) => h && Number.isFinite(h.s) && Number.isFinite(h.e) && h.e > h.s)
    .map((h) => [Math.max(0, h.s), Math.min(full.length, h.e)])
    .filter(([s, e]) => e > s);
  if (refHits.length === 0 && uh.length === 0) return mathRich(text);
  const bounds = new Set([0, full.length]);
  refHits.forEach(([s, e]) => {
    bounds.add(Math.max(0, s));
    bounds.add(Math.min(full.length, e));
  });
  uh.forEach(([s, e]) => {
    bounds.add(s);
    bounds.add(e);
  });
  const pts = [...bounds].sort((a, b) => a - b);
  const covers = (segs, a, b) => segs.some(([s, e]) => s < b && e > a);
  const out = [];
  for (let k = 0; k + 1 < pts.length; k++) {
    const a = pts[k];
    const b = pts[k + 1];
    if (b <= a) continue;
    const isRef = covers(refHits, a, b);
    const isUser = covers(uh, a, b);
    const slice = full.slice(a, b);
    if (isUser) {
      out.push(
        <mark
          key={`u${a}-${b}`}
          className={isRef ? "ref-mark user-mark" : "user-mark"}
          onClick={() => onUnmark && onUnmark(a, b)}
          title="Tap to remove this highlight"
        >
          {mathRich(slice)}
        </mark>
      );
    } else if (isRef) {
      out.push(
        <mark key={`m${a}-${b}`} className="ref-mark">
          {mathRich(slice)}
        </mark>
      );
    } else {
      out.push(<span key={`t${a}`}>{mathRich(slice)}</span>);
    }
  }
  return out;
}
const FILTERS = ["All", "Marked", "Unanswered", "Answered"];
const STATUS_LABEL = { marked: "Marked", answered: "Answered", unanswered: "Unanswered" };

/* *italic* mini-markup used in stems, options, and explanations. */
function rich(text) {
  return String(text)
    .split(/\*([^*]+)\*/g)
    .map((part, i) => (i % 2 === 1 ? <em key={i}>{part}</em> : <span key={i}>{part}</span>));
}

function optText(opt) {
  return opt === "No Change" ? <strong>No Change</strong> : mathRich(opt);
}

/* Passage spans: {t} plain text (may include $LaTeX$), {u, t} tested
   underline keyed by question number, {box} reference point, {fig}
   embedded SVG figure id resolved from the test's figures map. The active
   question's span lights up; boxed points light up when the active question
   anchors to them via its "point" field — except Placement questions, which
   must never light a box (the lit box would give away the answer). */
function renderSpans(spans, q, figures) {
  const isPlacement = /placement/i.test(q.tag || "");
  return spans.map((s, i) => {
    if (s.fig !== undefined) {
      const svg = figures && figures[s.fig];
      if (!svg) return null;
      return (
        <span
          key={i}
          className="passage-figure"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      );
    }
    if (s.u !== undefined) {
      const active = s.u === q.n;
      return (
        <span key={i} className={active ? "u-mark active" : "u-mark"}>
          {mathRich(s.t)}
          <sup className={active ? "u-sup active" : "u-sup"}>{s.u}</sup>
        </span>
      );
    }
    if (s.box !== undefined) {
      const active = !isPlacement && q.point === s.box;
      return (
        <span key={i} className={active ? "box-ref active" : "box-ref"}>
          [{s.box}]
        </span>
      );
    }
    return <span key={i}>{mathRich(s.t)}</span>;
  });
}

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatPace(sec) {
  if (sec === null || sec === undefined) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const DESMOS_KEY =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_DESMOS_API_KEY) ||
  "c6f78eb83b074ebcac28827b8e5ebea2";

let desmosPromise = null;

function loadDesmos() {
  if (typeof window !== "undefined" && window.Desmos) return Promise.resolve();
  if (!desmosPromise) {
    desmosPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `https://www.desmos.com/api/v1.12/calculator.js?apiKey=${DESMOS_KEY}`;
      s.async = true;
      s.onload = () => {
        if (window.Desmos) resolve();
        else {
          desmosPromise = null;
          reject(new Error("Desmos API loaded but unavailable"));
        }
      };
      s.onerror = () => {
        desmosPromise = null;
        reject(new Error("Desmos script failed to load"));
      };
      document.head.appendChild(s);
    });
  }
  return desmosPromise;
}

export function preloadDesmos() {
  loadDesmos().catch(() => {});
}

function DesmosCalc({ mode, apiRef, initialState, onSnapshot }) {
  const elRef = useRef(null);
  const calcRef = useRef(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    const settledLayout = () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
    loadDesmos()
      .then(() => settledLayout())
      .then(() => {
        if (cancelled || !elRef.current || !window.Desmos) {
          throw new Error("unavailable");
        }
        const api =
          mode === "scientific"
            ? window.Desmos.ScientificCalculator(elRef.current)
            : window.Desmos.GraphingCalculator(elRef.current);
        calcRef.current = api;
        if (apiRef) apiRef.current = api;
        try {
          if (initialState) api.setState(initialState);
        } catch (err) {
          window.console.debug("desmos initial state skipped", err);
        }
        if (!cancelled) setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      const c = calcRef.current;
      calcRef.current = null;
      if (apiRef) apiRef.current = null;
      if (c) {
        if (onSnapshot) {
          try {
            onSnapshot(c.getState());
          } catch (err) {
            window.console.debug("desmos snapshot skipped", err);
          }
        }
        if (typeof c.destroy === "function") c.destroy();
      }
    };
  }, [mode]);

  return (
    <div className="desmos-wrap">
      <div className="desmos-box" ref={elRef} />
      {status === "loading" && (
        <div className="desmos-loading" role="status">
          <span className="desmos-spinner" aria-hidden="true" />
          <span>Loading calculator…</span>
        </div>
      )}
      {status === "error" && (
        <div className="desmos-loading" role="alert">
          <span>Couldn't load the calculator. Check your connection, close it, and reopen.</span>
        </div>
      )}
    </div>
  );
}

function dropSelection() {
  if (typeof window === "undefined") return;
  const sel = window.getSelection();
  if (sel) sel.removeAllRanges();
}

function ElimIcon({ off }) {
  if (off) {
    return (
      <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true">
        <path
          d="M2.5 7.5h6.5M8.2 4.3l3.2 3.2-3.2 3.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="5.6" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <line x1="3.9" y1="11.1" x2="11.1" y2="3.9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function QBits({ q, picked, showAnswers, paused, flagged, serifStem, onPick, onToggleFlag, letters, elimActive, elimSet, onToggleElim }) {
  const L = letters && letters.length === 4 ? letters : LETTERS;
  return (
    <>
      <div className="q-head">
        <span className="q-badge">{q.n}</span>
        <span className="q-tag">{q.tag}</span>
      </div>
      {q.stem ? (
        serifStem ? (
          <div className="passage-text merged-stem">
            <p>{mathRich(q.stem)}</p>
          </div>
        ) : (
          <p className="q-stem">{mathRich(q.stem)}</p>
        )
      ) : null}
      {paused && (
        <p className="paused-note">Paused — answer choices are locked. Tap play to resume.</p>
      )}
      <div className={paused ? "q-options locked" : elimActive ? "q-options elim-mode" : "q-options"}>
          {q.options.map((opt, i) => {
            const letter = L[i];
          const eliminated = elimSet ? elimSet.includes(letter) : false;
          const cls = ["q-option"];
          if (picked === letter) cls.push("selected");
          if (eliminated) cls.push("eliminated");
          if (showAnswers && letter === q.answer) cls.push("correct");
          if (showAnswers && picked === letter && letter !== q.answer) cls.push("wrong");
          return (
            <div key={letter} className="q-option-row">
              <button
                type="button"
                className={cls.join(" ")}
                onClick={() => onPick(letter)}
              >
                <span className="q-letter">{letter}</span>
                <span className="q-text">{optText(opt)}</span>
              </button>
              {elimActive && (
                <button
                  key={eliminated ? "restore" : "elim"}
                  type="button"
                  className={eliminated ? "elim-btn is-off" : "elim-btn"}
                  style={{ animationDelay: `${i * 45}ms` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleElim(letter);
                  }}
                  title={eliminated ? `Restore option ${letter}` : `Eliminate option ${letter}`}
                  aria-label={eliminated ? `Restore option ${letter}` : `Eliminate option ${letter}`}
                  aria-pressed={eliminated}
                >
                  <ElimIcon off={eliminated} />
                </button>
              )}
            </div>
          );
        })}
      </div>
      {showAnswers && (
        <div className={picked === q.answer ? "explain ok" : "explain no"}>
          <span className="explain-head">
            {picked === q.answer ? "Correct" : `Correct answer: ${q.answer}`}
          </span>
          <p className="explain-text">{mathRich(q.explain)}</p>
        </div>
      )}
      <button
        type="button"
        className={flagged ? "flag-btn on" : "flag-btn"}
        onClick={onToggleFlag}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M3.5 14.5v-12M3.5 3c3-2 5.5 2 9 0v7c-3.5 2-6-2-9 0"
            fill={flagged ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>{flagged ? "Flagged for review" : "Flag this question"}</span>
      </button>
    </>
  );
}

export default function TestScreen({ test, session, startIndex, review, findTest, customTestData, onFinish, onExit }) {
  const timed = test.mode === "timed" && !review;
  const testData =
    customTestData && customTestData.id === test.id ? customTestData : findTest(test.id);
  const questions = testData ? testData.questions : [];
  const total = questions.length;
  const needIntro = !review && !!(testData && testData.intro);
  const [introDone, setIntroDone] = useState(false);
  const [qIndex, setQIndex] = useState(startIndex || 0);
  const [picks, setPicks] = useState((session && session.picks) || {});
  const [flags, setFlags] = useState((session && session.flags) || {});
  const [paces, setPaces] = useState((session && session.paces) || {});
  const [elapsed, setElapsed] = useState(0);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [ovFilter, setOvFilter] = useState("All");
  const [paused, setPaused] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcMode, setCalcMode] = useState("graph");
  const [calcFull, setCalcFull] = useState(false);
  const [calcW, setCalcW] = useState(440);
  const [elimOn, setElimOn] = useState(false);
  const [elims, setElims] = useState({});
  const [marks, setMarks] = useState({});
  const [hlPop, setHlPop] = useState(null);
  const passageWrapRef = useRef(null);
  const paraRefs = useRef(new Map());
  const pendingHl = useRef(null);
  const marksRef = useRef({});

  const togglePause = () => {
    setPaused((p) => {
      pausedRef.current = !p;
      return !p;
    });
  };
  const elapsedRef = useRef(0);
  const enterRef = useRef(0);
  const prevPassageRef = useRef(null);
  const bodyRef = useRef(null);
  const calcApiRef = useRef(null);
  const desmosStates = useRef({});
  const desmosQRef = useRef(null);
  const boardApiRef = useRef(null);
  const boardStore = useRef({});
  const prevQRef = useRef(null);
  const pausedRef = useRef(false);
  const introDoneRef = useRef(false);
  /* Mirror of paces state for use inside interval/effects without stale closures. */
  const pacesRef = useRef((session && session.paces) || {});

  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current) return;
      if (needIntro && !introDoneRef.current) return;
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const mathTest = /^MATH-/i.test(test.id) || ((testData && testData.section) || "").toLowerCase() === "math";
    if (mathTest) preloadDesmos();
  }, []);

  useEffect(() => {
    marksRef.current = marks;
  }, [marks]);

  useEffect(() => {
    const hide = () => setHlPop((p) => (p ? null : p));
    const onSel = () => {
      const wrap = passageWrapRef.current;
      const sel = typeof window !== "undefined" ? window.getSelection() : null;
      if (!wrap || !sel || sel.isCollapsed || sel.rangeCount === 0) {
        hide();
        return;
      }
      let range = null;
      try {
        range = sel.getRangeAt(0);
      } catch {
        hide();
        return;
      }
      if (!wrap.contains(range.commonAncestorContainer)) {
        hide();
        return;
      }
      const paraOf = (node) => {
        const el = node.nodeType === 1 ? node : node.parentElement;
        return el && el.closest ? el.closest("[data-para]") : null;
      };
      const startP = paraOf(range.startContainer);
      const endP = paraOf(range.endContainer);
      if (!startP || startP !== endP) {
        hide();
        return;
      }
      const text = range.toString();
      if (!text || text.trim().length < 2) {
        hide();
        return;
      }
      let rect = null;
      try {
        rect = range.getBoundingClientRect();
      } catch {
        hide();
        return;
      }
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        hide();
        return;
      }
      pendingHl.current = { para: Number(startP.dataset.para), text };
      const vw = window.innerWidth || 400;
      setHlPop({
        x: Math.min(Math.max(rect.left + rect.width / 2, 76), vw - 76),
        y: Math.max(rect.top, 64),
      });
    };
    document.addEventListener("selectionchange", onSel);
    window.addEventListener("scroll", hide, { capture: true, passive: true });
    return () => {
      document.removeEventListener("selectionchange", onSel);
      window.removeEventListener("scroll", hide, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (((testData && testData.section) || "").toLowerCase() !== "reading") return;
    const cur = questions[Math.min(qIndex, total - 1)];
    if (!cur) return;
    const list = marksRef.current[cur.p] || [];
    if (list.length === 0) return;
    const target = list.reduce((m, h) => Math.min(m, h.para), Infinity);
    const el = paraRefs.current.get(`${cur.p}-${target}`);
    if (el) {
      try {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } catch {
        el.scrollIntoView();
      }
    }
  }, [qIndex]);

  useEffect(() => {
    /* Leaving a question: bank the time spent on it into its pace. */
    const leavingN = prevQRef.current;
    if (!review && leavingN !== null && leavingN !== undefined) {
      const delta = elapsedRef.current - enterRef.current;
      if (delta > 0) {
        pacesRef.current = {
          ...pacesRef.current,
          [leavingN]: (pacesRef.current[leavingN] || 0) + delta,
        };
        setPaces({ ...pacesRef.current });
      }
    }
    const active = questions[Math.min(qIndex, total - 1)];
    const pid = active?.p;
    if (prevPassageRef.current === null || prevPassageRef.current !== pid) {
      window.scrollTo(0, 0);
    }
    prevPassageRef.current = pid;
    prevQRef.current = active ? active.n : null;
    enterRef.current = elapsedRef.current;
  }, [qIndex, total]);

  useEffect(() => {
    const api = calcApiRef.current;
    const cur = questions[Math.min(qIndex, total - 1)];
    const curN = cur ? cur.n : null;
    if (api && desmosQRef.current !== null && desmosQRef.current !== curN) {
      try {
        desmosStates.current[desmosQRef.current] = api.getState();
      } catch (err) {
        window.console.debug("desmos save skipped", err);
      }
    }
    if (api && curN !== null) {
      try {
        const saved = desmosStates.current[curN];
        if (saved) api.setState(saved);
        else api.setBlank();
      } catch (err) {
        window.console.debug("desmos restore skipped", err);
      }
    }
    desmosQRef.current = curN;
  }, [qIndex]);

  if (!testData) {
    return (
      <div className="test">
        <div className="missing">
          <h2>Coming soon</h2>
          <p>Questions for this test are still being added.</p>
          <button className="btn-primary" type="button" onClick={onExit}>
            BACK TO PRACTICE
          </button>
        </div>
      </div>
    );
  }

  const activeQ = questions[Math.min(qIndex, total - 1)];
  const passage = testData.passages.find((p) => p.id === activeQ.p);
  const qLetters = lettersFor(activeQ.n, testData.section);
  const picked = picks[activeQ.n] || null;
  const flagged = !!flags[activeQ.n];
  const marksHere = marks[passage.id] || [];
  const passageMarkCount = marksHere.length;
  const showAnswers = review;
  const answeredCount = questions.filter((q) => picks[q.n]).length;
  const answeredFrac = total ? answeredCount / total : 0;
  const fillClass = answeredFrac < 0.34 ? "fill-low" : answeredFrac < 0.67 ? "fill-mid" : "";

  const limit = testData.timeMinutes * 60;
  const remaining = Math.max(0, limit - elapsed);
  const expired = timed && remaining === 0;

  const pick = (letter) => {
    if (review || paused) return;
    const n = activeQ.n;
    setPicks((p) => {
      if (p[n] === letter) {
        const next = { ...p };
        delete next[n];
        return next;
      }
      return { ...p, [n]: letter };
    });
    setElims((m) => {
      const cur = m[n] || [];
      if (!cur.includes(letter)) return m;
      return { ...m, [n]: cur.filter((l) => l !== letter) };
    });
  };

  const toggleElim = (letter) => {
    if (review || paused) return;
    const n = activeQ.n;
    setElims((m) => {
      const cur = m[n] || [];
      return {
        ...m,
        [n]: cur.includes(letter) ? cur.filter((l) => l !== letter) : [...cur, letter],
      };
    });
  };

  const elimActive = elimOn && !review && !paused;
  const elimSet = elims[activeQ.n] || [];

  const addHighlight = () => {
    const pend = pendingHl.current;
    setHlPop(null);
    pendingHl.current = null;
    if (!pend || !passage) return;
    const paraText = passage.paras[pend.para];
    if (typeof paraText !== "string") return;
    const list = marksRef.current[passage.id] || [];
    if (list.length >= 40) return;
    const hit = findQuote(paraText, pend.text, 0);
    if (!hit) return;
    if (list.some((h) => h.para === pend.para && h.s === hit[0] && h.e === hit[1])) {
      dropSelection();
      return;
    }
    const entry = { para: pend.para, text: pend.text, s: hit[0], e: hit[1] };
    marksRef.current = { ...marksRef.current, [passage.id]: [...list, entry] };
    setMarks(marksRef.current);
    dropSelection();
  };

  const unmarkRange = (para, a, b) => {
    if (!passage) return;
    setMarks((m) => {
      const list = m[passage.id] || [];
      const next = list.filter((h) => !(h.para === para && h.s < b && h.e > a));
      if (next.length === list.length) return m;
      marksRef.current = { ...m, [passage.id]: next };
      return marksRef.current;
    });
  };

  const clearPassageMarks = () => {
    if (!passage) return;
    setMarks((m) => {
      if (!(m[passage.id] || []).length) return m;
      marksRef.current = { ...m, [passage.id]: [] };
      return marksRef.current;
    });
  };

  const toggleFlag = () => {
    const n = activeQ.n;
    setFlags((f) => ({ ...f, [n]: !f[n] }));
  };

  const statusOf = (n) => {
    if (flags[n]) return "marked";
    if (picks[n]) return "answered";
    return "unanswered";
  };

  const visibleQs = questions.filter((q) => {
    if (ovFilter === "All") return true;
    if (ovFilter === "Marked") return statusOf(q.n) === "marked";
    if (ovFilter === "Answered") return statusOf(q.n) === "answered";
    return statusOf(q.n) === "unanswered";
  });

  const showCalc = /^MATH-/i.test(test.id) || (testData.section || "").toLowerCase() === "math";
  const merged = calcOpen && showCalc;

  const goTo = (n) => {
    const idx = questions.findIndex((q) => q.n === n);
    if (idx >= 0) setQIndex(idx);
    if (needIntro && !introDoneRef.current) {
      setIntroDone(true);
      introDoneRef.current = true;
    }
  };

  const goToIntro = () => {
    setSlideIdx(0);
    setIntroDone(false);
    introDoneRef.current = false;
    window.scrollTo(0, 0);
  };

  const completeIntro = () => {
    setIntroDone(true);
    introDoneRef.current = true;
    window.scrollTo(0, 0);
  };

  const [copied, setCopied] = useState(false);

  const copyScreen = async () => {
    const clean = (s) => String(s || "").replace(/\*/g, "");
    const lines = [`Question ${activeQ.n} (${activeQ.tag})`];
    if (activeQ.stem) {
      lines.push(clean(activeQ.stem));
    } else if (passage) {
      lines.push(
        passage.paras
          .map((pa) =>
            typeof pa === "string"
              ? clean(pa)
              : pa
                  .map((s) => (s.box !== undefined ? ` [${s.box}]` : clean(s.t)))
                  .join("")
                  .replace(/\s+/g, " ")
                  .trim()
          )
          .join("\n")
      );
    }
    activeQ.options.forEach((opt, i) => {
      lines.push(`${qLetters[i]}. ${clean(opt)}`);
    });
    const elimHere = elims[activeQ.n] || [];
    if (elimHere.length > 0) lines.push(`Eliminated: ${elimHere.join(", ")}`);
    try {
      const api = calcApiRef.current;
      const st = api && api.getState ? api.getState() : null;
      const list = (st && st.expressions && st.expressions.list) || [];
      const latex = list
        .map((e) => e && e.latex)
        .filter((l) => typeof l === "string" && l.trim() !== "");
      if (latex.length > 0) {
        lines.push("The user tried the math by the following equations on Desmos:");
        latex.forEach((l) => lines.push(`  ${l}`));
      }
    } catch (err) {
      window.console.debug("desmos copy skipped", err);
    }
    const text = lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      window.console.debug("clipboard failed, using fallback", err);
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const startDrag = (e) => {
    e.preventDefault();
    const move = (ev) => {
      const body = bodyRef.current;
      if (!body) return;
      const rect = body.getBoundingClientRect();
      const w = Math.round(rect.right - ev.clientX - 12);
      setCalcW(Math.min(Math.max(w, 300), Math.floor(rect.width * 0.7)));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const openCalc = () => {
    const body = bodyRef.current;
    if (body) {
      const w = body.getBoundingClientRect().width;
      setCalcW(Math.min(Math.max(Math.round(w * 0.6), 300), Math.floor(w * 0.7)));
    }
    setCalcOpen(true);
  };

  const resetCalc = () => {
    const body = bodyRef.current;
    if (body) {
      const w = body.getBoundingClientRect().width;
      setCalcW(Math.min(Math.max(Math.round(w * 0.6), 300), Math.floor(w * 0.7)));
    } else {
      setCalcW(440);
    }
  };

  const toggleFull = (v) => {
    const api = calcApiRef.current;
    if (api) {
      try {
        desmosStates.current[desmosQRef.current] = api.getState();
      } catch (err) {
        window.console.debug("desmos pre-toggle snapshot skipped", err);
      }
    }
    if (boardApiRef.current) {
      try {
        const objs = boardApiRef.current();
        if (desmosQRef.current !== null && desmosQRef.current !== undefined) {
          boardStore.current[desmosQRef.current] = objs;
        }
      } catch (err) {
        window.console.debug("board pre-toggle snapshot skipped", err);
      }
    }
    setCalcFull(v);
  };

  const commitActivePace = () => {
    if (review) return { ...pacesRef.current };
    const n = activeQ.n;
    const delta = elapsedRef.current - enterRef.current;
    if (delta > 0) {
      pacesRef.current = { ...pacesRef.current, [n]: (pacesRef.current[n] || 0) + delta };
      setPaces({ ...pacesRef.current });
    }
    enterRef.current = elapsedRef.current;
    return { ...pacesRef.current };
  };

  const handleFinish = () => {
    const finalPaces = commitActivePace();
    onFinish({ picks, flags, paces: finalPaces });
  };

  const livePace = (n) => {
    if (review || n !== activeQ.n) return paces[n];
    const running = elapsed - enterRef.current;
    return (paces[n] || 0) + Math.max(0, running);
  };

  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const snapshotRef = useRef(null);
  snapshotRef.current = { picks, flags, paces };
  const autoDoneRef = useRef(false);

  useEffect(() => {
    if (timed && remaining === 0 && !autoDoneRef.current) {
      autoDoneRef.current = true;
      const activeN = prevQRef.current;
      const delta = elapsedRef.current - enterRef.current;
      const finalPaces =
        activeN !== null && activeN !== undefined && delta > 0
          ? { ...pacesRef.current, [activeN]: (pacesRef.current[activeN] || 0) + delta }
          : { ...pacesRef.current };
      finishRef.current({ ...snapshotRef.current, paces: finalPaces });
    }
  }, [timed, remaining]);

  const onIntro = needIntro && !introDone;
  const intro = (testData && testData.intro) || null;
  const slides =
    intro && Array.isArray(intro.slides) && intro.slides.length > 0
      ? intro.slides
      : [{ heading: intro && intro.heading, blocks: (intro && intro.blocks) || [] }];
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const onKey = (e) => {
      if (calcFull) return;
      const tag = (e.target && e.target.tagName) || "";
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || (e.target && e.target.isContentEditable)) return;
      const inIntro = needIntro && !introDoneRef.current;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (inIntro) {
          if (slideIdx < slides.length - 1) {
            setSlideIdx(slideIdx + 1);
            window.scrollTo(0, 0);
          } else {
            completeIntro();
          }
          return;
        }
        setQIndex((i) => Math.min(i + 1, total - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (inIntro) {
          if (slideIdx > 0) {
            setSlideIdx(slideIdx - 1);
            window.scrollTo(0, 0);
          }
          return;
        }
        setQIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setOverviewOpen((v) => !v);
      } else if (e.key === "ArrowDown") {
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (review) return;
          const n = prevQRef.current;
          const delta = elapsedRef.current - enterRef.current;
          const finalPaces =
            n !== null && n !== undefined && delta > 0
              ? { ...pacesRef.current, [n]: (pacesRef.current[n] || 0) + delta }
              : { ...pacesRef.current };
          finishRef.current({ ...snapshotRef.current, paces: finalPaces });
        } else if (showCalc && !calcOpen) {
          e.preventDefault();
          openCalc();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="test">
      <header className="test-topbar">
        <button className="test-exit" type="button" aria-label="Exit test" onClick={onExit}>
          ✕
        </button>
        <button className="overview-btn" type="button" onClick={() => setOverviewOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <rect x="1.5" y="1.5" width="5.2" height="5.2" rx="1.4" fill="currentColor" />
            <rect x="9.3" y="1.5" width="5.2" height="5.2" rx="1.4" fill="currentColor" opacity="0.45" />
            <rect x="1.5" y="9.3" width="5.2" height="5.2" rx="1.4" fill="currentColor" opacity="0.45" />
            <rect x="9.3" y="9.3" width="5.2" height="5.2" rx="1.4" fill="currentColor" />
          </svg>
          <span>Overview</span>
        </button>
        <div className="test-title">
          <span className="test-title-main">{testData.title}</span>
        </div>
        {timed && (
          <div className="test-timer-wrap">
            {!onIntro && (
            <button
              className="pause-btn"
              type="button"
              aria-label={paused ? "Resume timer" : "Pause timer"}
              onClick={togglePause}
            >
              {paused ? (
                <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true">
                  <path d="M4 2.5v10l8-5z" fill="currentColor" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true">
                  <rect x="3" y="2.5" width="3.4" height="10" rx="1" fill="currentColor" />
                  <rect x="8.6" y="2.5" width="3.4" height="10" rx="1" fill="currentColor" />
                </svg>
              )}
            </button>
            )}
            <div className={expired ? "test-timer danger" : paused ? "test-timer paused" : "test-timer"}>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 4.8V8l2.4 1.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span>{formatClock(remaining)}</span>
            </div>
          </div>
        )}
        {showCalc && (
          <button
            className={calcOpen ? "calc-btn on" : "calc-btn"}
            type="button"
            aria-label={calcOpen ? "Close calculator" : "Open calculator"}
            onClick={() => (calcOpen ? setCalcOpen(false) : openCalc())}
          >
            <svg width="17" height="17" viewBox="0 0 17 17" aria-hidden="true">
              <rect x="2.5" y="1.5" width="12" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <rect x="5.5" y="4" width="6" height="2.6" rx="1" fill="currentColor" />
              <g fill="currentColor">
                <circle cx="6.2" cy="9.5" r="1" />
                <circle cx="8.5" cy="9.5" r="1" />
                <circle cx="10.8" cy="9.5" r="1" />
                <circle cx="6.2" cy="12" r="1" />
                <circle cx="8.5" cy="12" r="1" />
                <circle cx="10.8" cy="12" r="1" />
              </g>
            </svg>
            <span>Calculator</span>
          </button>
        )}
        <div className="test-progress">
          <span className="test-progress-label">
            Answered {answeredCount} of {total}
          </span>
          <span className="test-progress-track">
            <span
              className={`test-progress-fill ${fillClass}`}
              style={{ width: `${answeredFrac * 100}%` }}
            />
          </span>
        </div>
      </header>

      <div className={calcOpen && showCalc ? "test-body calc-open" : "test-body"} ref={bodyRef}>
        {onIntro ? (
          <div className="intro-step">
            <div className="intro-card">
              <p className="results-kicker">
                Before you start{slides.length > 1 ? ` · ${slideIdx + 1} of ${slides.length}` : ""}
              </p>
              <h1 className="intro-title">{(slides[slideIdx] && slides[slideIdx].heading) || testData.title}</h1>
              <div className="intro-blocks">
                {((slides[slideIdx] && slides[slideIdx].blocks) || []).map((b, i) => {
                  if (b.h) return <h4 key={i} className="lesson-h">{b.h}</h4>;
                  if (b.math) return <div key={i} className="lesson-math"><MathText text={`$$${b.math}$$`} /></div>;
                  if (b.list) {
                    return (
                      <ul key={i} className="lesson-list">
                        {b.list.map((t, j) => (
                          <li key={j}><MathText text={t} /></li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={i} className="lesson-p"><MathText text={b.p || ""} /></p>;
                })}
              </div>
              {slides.length > 1 && (
                <div className="intro-dots" aria-hidden="true">
                  {slides.map((s, i) => (
                    <span key={i} className={i === slideIdx ? "intro-dot on" : "intro-dot"} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
        <article className="passage">
          {!merged && <h1 className="passage-title">{passage.title}</h1>}
          {passageMarkCount > 0 && (
            <div className="hl-bar">
              <button type="button" className="hl-clear" onClick={clearPassageMarks}>
                Clear highlights · {passageMarkCount}
              </button>
            </div>
          )}
          <div className="passage-text" ref={passageWrapRef}>
            {passage.paras.map((pa, i) =>
              typeof pa === "string" ? (
                <p
                  key={`${passage.id}-${i}`}
                  data-para={i}
                  ref={(el) => {
                    if (el) paraRefs.current.set(`${passage.id}-${i}`, el);
                    else paraRefs.current.delete(`${passage.id}-${i}`);
                  }}
                >
                  {renderParaText(
                    pa,
                    (activeQ.refs || []).filter((r) => r.para === i),
                    marksHere.filter((h) => h.para === i),
                    (a, b) => unmarkRange(i, a, b)
                  )}
                </p>
              ) : (
                <p key={`${passage.id}-${i}`}>{renderSpans(pa, activeQ, testData.figures)}</p>
              )
            )}
          </div>
          {merged && (
            <>
              <hr className="merged-divider" />
              <QBits
                q={activeQ}
                picked={picked}
                showAnswers={showAnswers}
                paused={paused}
                flagged={flagged}
                serifStem
                letters={qLetters}
                onPick={pick}
                onToggleFlag={toggleFlag}
                elimActive={elimActive}
                elimSet={elimSet}
                onToggleElim={toggleElim}
              />
            </>
          )}
        </article>

        {!merged && (
        <aside className="question-panel">
          <section className="q-card" aria-label={`Question ${activeQ.n}`}>
            <QBits
              q={activeQ}
              picked={picked}
              showAnswers={showAnswers}
              paused={paused}
              flagged={flagged}
              serifStem={false}
              letters={qLetters}
              onPick={pick}
              onToggleFlag={toggleFlag}
              elimActive={elimActive}
              elimSet={elimSet}
              onToggleElim={toggleElim}
            />
          </section>

        </aside>
        )}
        {calcOpen && showCalc && !calcFull && (
          <div
            className="calc-divider"
            onPointerDown={startDrag}
            onDoubleClick={resetCalc}
            title="Drag to resize (double-click to reset)"
          />
        )}
        {calcOpen && showCalc && !calcFull && (
          <section className="calc-panel" style={{ width: calcW }} aria-label="Calculator">
            <div className="calc-head">
              <div className="calc-tabs" role="tablist" aria-label="Calculator type">
                <button
                  type="button"
                  role="tab"
                  aria-selected={calcMode === "graph"}
                  className={calcMode === "graph" ? "calc-tab active" : "calc-tab"}
                  onClick={() => setCalcMode("graph")}
                >
                  Graph
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={calcMode === "board"}
                  className={calcMode === "board" ? "calc-tab active" : "calc-tab"}
                  onClick={() => setCalcMode("board")}
                >
                  Board
                </button>
              </div>
            <div className="calc-head-actions">
              <button
                type="button"
                className="calc-full-btn"
                aria-label="Fullscreen calculator"
                title="Fullscreen"
                onClick={() => toggleFull(true)}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </button>
              <button
                type="button"
                className="modal-close"
                aria-label="Close calculator"
                onClick={() => setCalcOpen(false)}
              >
                ✕
              </button>
            </div>
            </div>
            {calcMode === "board" ? (
              <FreestyleBoard qkey={activeQ.n} store={boardStore} apiRef={boardApiRef} />
            ) : (
              <DesmosCalc
              mode={calcMode}
              apiRef={calcApiRef}
              initialState={desmosStates.current[desmosQRef.current]}
              onSnapshot={(s) => {
                if (desmosQRef.current !== null) desmosStates.current[desmosQRef.current] = s;
              }}
            />
            )}
          </section>
        )}
      {calcOpen && showCalc && calcFull && (
        <div className="calc-fullscreen" role="dialog" aria-label="Calculator fullscreen">
          <div className="calc-full-head">
            <div className="calc-tabs" role="tablist" aria-label="Calculator type">
              <button
                type="button"
                role="tab"
                aria-selected={calcMode === "graph"}
                className={calcMode === "graph" ? "calc-tab active" : "calc-tab"}
                onClick={() => setCalcMode("graph")}
              >
                Graph
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={calcMode === "board"}
                className={calcMode === "board" ? "calc-tab active" : "calc-tab"}
                onClick={() => setCalcMode("board")}
              >
                Board
              </button>
            </div>
            <button
              type="button"
              className="calc-full-exit"
              aria-label="Exit fullscreen"
              title="Back to split view"
              onClick={() => toggleFull(false)}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="4 14 10 14 10 20" />
                <polyline points="20 10 14 10 14 4" />
                <line x1="3" y1="21" x2="10" y2="14" />
                <line x1="21" y1="3" x2="14" y2="10" />
              </svg>
            </button>
          </div>
          <div className="calc-full-body">
            {calcMode === "board" ? (
              <FreestyleBoard qkey={activeQ.n} store={boardStore} apiRef={boardApiRef} />
            ) : (
              <DesmosCalc
                mode={calcMode}
                apiRef={calcApiRef}
                initialState={desmosStates.current[desmosQRef.current]}
                onSnapshot={(s) => {
                  if (desmosQRef.current !== null) desmosStates.current[desmosQRef.current] = s;
                }}
              />
            )}
          </div>
        </div>
      )}
          </>
        )}
      </div>

      <div className="test-nav">
        <div className="test-nav-inner">
          <button
            className={copied ? "copy-icon-btn copied" : "copy-icon-btn"}
            type="button"
            onClick={copyScreen}
            title="Copy question, options and Desmos equations"
            aria-label="Copy question to clipboard"
          >
            {copied ? (
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path
                  d="M3 9.5l4 4 8-9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <rect
                  x="6"
                  y="6"
                  width="9"
                  height="9"
                  rx="2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M12 6V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
            )}
          </button>
          <button
            className="nav-btn"
            type="button"
            disabled={onIntro ? slideIdx === 0 : qIndex === 0}
                onClick={() => {
                  if (onIntro && slideIdx > 0) {
                    setSlideIdx(slideIdx - 1);
                    window.scrollTo(0, 0);
                  } else {
                    setQIndex(qIndex - 1);
                  }
                }}
              >
                BACK
              </button>
          <span className="nav-count">
            {onIntro ? "Intro" : `${qIndex + 1} of ${total}`}
          </span>
          {review ? (
            <>
              <button
                className="nav-btn primary"
                type="button"
                disabled={qIndex === total - 1}
                onClick={() => setQIndex(qIndex + 1)}
              >
                NEXT
              </button>
              <button className="nav-btn" type="button" onClick={onExit}>
                RESULT
              </button>
            </>
          ) : !onIntro && qIndex === total - 1 ? (            <button
              className="nav-btn primary"
              type="button"
              onClick={handleFinish}
            >
              FINISH
            </button>
          ) : (
                <button
                  className="nav-btn primary"
                  type="button"
                  onClick={
                    onIntro
                      ? () => {
                          if (slideIdx < slides.length - 1) {
                            setSlideIdx(slideIdx + 1);
                            window.scrollTo(0, 0);
                          } else {
                            completeIntro();
                          }
                        }
                      : () => setQIndex(qIndex + 1)
                  }
                >
                  NEXT
                </button>
              )}
          {!review && (
            <button
              className={elimOn ? "elim-toggle on" : "elim-toggle"}
              type="button"
              onClick={() => setElimOn((v) => !v)}
              title={elimOn ? "Hide answer eliminator" : "Show answer eliminator"}
              aria-label={elimOn ? "Hide answer eliminator" : "Show answer eliminator"}
              aria-pressed={elimOn}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <line x1="2.5" y1="5" x2="10" y2="5" />
                  <line x1="2.5" y1="9" x2="10" y2="9" />
                  <line x1="2.5" y1="13" x2="7.5" y2="13" />
                </g>
                <line
                  x1="4"
                  y1="15.5"
                  x2="15"
                  y2="3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {hlPop && (
        <button
          type="button"
          className="hl-pop"
          style={{ left: hlPop.x, top: hlPop.y }}
          onMouseDown={(e) => e.preventDefault()}
          onClick={addHighlight}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M9.7 1.3l3 3L5.2 11.8l-3.7.7.7-3.7z" fill="currentColor" />
          </svg>
          <span>Highlight</span>
        </button>
      )}

      {overviewOpen && (        <div className="overview-overlay" onClick={() => setOverviewOpen(false)}>
          <aside
            className="overview-drawer"
            aria-label="Test overview"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ov-top">
              <div className="ov-head">
              <h2 className="ov-title">Test Overview</h2>
              <button className="modal-close" type="button" aria-label="Close overview" onClick={() => setOverviewOpen(false)}>
                ✕
              </button>
            </div>
            <div className="ov-filters">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={ovFilter === f ? "ov-filter active" : "ov-filter"}
                  onClick={() => setOvFilter(f)}
                >
                  {f}
                </button>
              ))}
              </div>
            </div>
            <div className="ov-list">
              {testData.intro && ovFilter === "All" && (
                <button
                  type="button"
                  className={onIntro ? "ov-row current" : "ov-row"}
                  onClick={goToIntro}
                >
                  <span className="ov-q-top">
                    <span className="q-tag">INTRO</span>
                    <span className="ov-stem">Start here — read the note slide</span>
                  </span>
                </button>
              )}
              {visibleQs.map((q) => {
                const st = statusOf(q.n);
                return (
                  <button
                    key={q.n}
                    type="button"
                    className={q.n === activeQ.n ? "ov-row current" : "ov-row"}
                    onClick={() => goTo(q.n)}
                  >
                    <span className="ov-q-top">
                      <span className="q-badge sm">{q.n}</span>
                      <span className="ov-stem">{(q.short || q.stem || "").replace(/\*/g, "")}</span>
                    </span>
                    <span className="ov-q-bottom">
                      <span className={`ov-status ${st}`}>
                        <span className="ov-dot" aria-hidden="true" />
                        {STATUS_LABEL[st]}
                      </span>
                      <span className="ov-pace">{formatPace(livePace(q.n))}</span>
                    </span>
                  </button>
                );
              })}
              {visibleQs.length === 0 && (
                <p className="ov-empty">No questions match this filter.</p>
              )}
            </div>
            {!review && (
              <div className="ov-finish">
                <button
                  className="finish-btn"
                  type="button"
                  onClick={() => {
                    setOverviewOpen(false);
                    handleFinish();
                  }}
                >
                  FINISH THIS EXAM
                </button>
              </div>
            )}
        </aside>
        </div>
      )}
    </div>
  );
}
