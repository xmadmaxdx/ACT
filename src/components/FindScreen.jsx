import { useEffect, useRef, useState } from "react";
import { mathRich } from "./MathText.jsx";
import CodinoPanel from "../ai/CodinoPanel.jsx";
import FindBtn from "./FindBtn.jsx";
import { scoreSelection } from "../detailScore.js";

/* Exact match first; otherwise the longest consecutive word-run of the quote
   present in the text (case-insensitive). Used only to locate JSON hint
   refs — picks use exact DOM offsets, never this. */
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
  if (refHits.length === 0 && uh.length === 0) return full;
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
          {slice}
        </mark>
      );
    } else if (isRef) {
      out.push(
        <mark key={`m${a}-${b}`} className="ref-mark">
          {slice}
        </mark>
      );
    } else {
      out.push(<span key={`t${a}`}>{slice}</span>);
    }
  }
  return out;
}
const FILTERS = ["All", "Marked", "Unanswered", "Answered"];
const STATUS_LABEL = { marked: "Marked", answered: "Answered", unanswered: "Unanswered" };

/* Placement / add-detail stems carry the proposed sentence as an *italic* (or
   _italic_) insert between a lead-in and a trailing question. The insert
   renders as an indented block; a multi-sentence lead-in splits after its
   first sentence so "asks about the passage as a whole" stands on its own
   line. Matches ONLY when an insert pair has non-blank text on both sides —
   anything else falls back to the normal inline mathRich render. */
function stemQuote(stem) {
  const s = String(stem);
  const grab = (re) => {
    const m = re.exec(s);
    if (!m || !m[1].trim() || !m[2].trim() || !m[3].trim()) return null;
    return { pre: m[1], inner: m[2].trim(), post: m[3] };
  };
  return (
    grab(/^(.*)\*([^*]+)\*([^*]*)$/) ||
    (!s.includes("__") ? grab(/^(.*)_([^_]+)_([^_]*)$/) : null)
  );
}
function renderStem(stem) {
  const q = stemQuote(stem);
  if (!q) return mathRich(stem);
  const pre = q.pre.trim();
  const sent = pre.length > 50 ? /^([^.?!]+[.?!])(\s+[\s\S]+)?$/.exec(pre) : null;
  const blocks = [];
  if (sent && sent[2]) {
    blocks.push(
      <span key="l1" className="q-stem-lead">
        {mathRich(sent[1])}
      </span>
    );
    blocks.push(
      <span key="l2" className="q-stem-lead">
        {mathRich(sent[2].trim())}
      </span>
    );
  } else {
    blocks.push(
      <span key="l1" className="q-stem-lead">
        {mathRich(pre)}
      </span>
    );
  }
  blocks.push(
    <span key="q" className="q-stem-quote">
      {mathRich(`*${q.inner}*`)}
    </span>
  );
  blocks.push(
    <span key="t" className="q-stem-tail">
      {mathRich(q.post.trim())}
    </span>
  );
  return <>{blocks}</>;
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

function dropSelection() {
  if (typeof window === "undefined") return;
  const sel = window.getSelection();
  if (sel) sel.removeAllRanges();
}

const PT_DEFAULT_TOTAL = 600;
const PT_CIRC = 2 * Math.PI * 54;

function ptBlank() {
  return { total: PT_DEFAULT_TOTAL, remaining: PT_DEFAULT_TOTAL, running: false, started: false };
}

let audioCtx = null;

function ensureAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  } catch (err) {
    window.console.debug("audio unavailable", err);
    return null;
  }
}

let tickBright = false;

function tickSound() {
  const ctx = ensureAudio();
  if (!ctx) return;
  try {
    tickBright = !tickBright;
    const t = ctx.currentTime;
    const bright = tickBright;
    const dur = 0.025;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const k = 1 - i / len;
      d[i] = (Math.random() * 2 - 1) * k * k;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = bright ? 3900 : 2900;
    bp.Q.value = 0.9;
    const gClick = ctx.createGain();
    gClick.gain.value = 1.0;
    src.connect(bp);
    bp.connect(gClick);
    gClick.connect(ctx.destination);
    src.start(t);
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = bright ? 640 : 490;
    const gBody = ctx.createGain();
    gBody.gain.setValueAtTime(0.0001, t);
    gBody.gain.exponentialRampToValueAtTime(0.4, t + 0.004);
    gBody.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(gBody);
    gBody.connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.08);
  } catch (err) {
    window.console.debug("tick skipped", err);
  }
}

function tripleTick() {
  tickSound();
  setTimeout(tickSound, 110);
  setTimeout(tickSound, 220);
}

function FindBits({ q, pick, paused, flagged, tried, verdict, onToggleFlag, onCheck, onClearPick, onExplain }) {
  return (
    <>
      <div className="q-head">
        <span className="q-badge">{q.n}</span>
        <span className="q-tag">{q.tag}</span>
      </div>
      {q.stem ? (
        <p className="q-stem">{renderStem(q.stem)}</p>
      ) : null}
      {paused && (
        <p className="paused-note">Paused — checking is locked. Tap play to resume.</p>
      )}
      <div className={pick ? "detail-answer filled" : "detail-answer"} aria-live="polite">
        {pick ? (
          <>
            <span className="detail-answer-text">{pick.text}</span>
            <span className="detail-answer-meta">
              ¶{pick.para + 1}{tried > 0 ? ` · ${tried} check${tried === 1 ? "" : "s"}` : ""}
            </span>
          </>
        ) : (
          <span className="detail-answer-empty">Select the answering words in the passage…</span>
        )}
      </div>
      <div className="detail-actions">
        <FindBtn className="detail-check light" onClick={onCheck} disabled={!pick || paused}>
          Check
        </FindBtn>
        {pick && (
          <FindBtn className="light" onClick={onClearPick}>
            Clear
          </FindBtn>
        )}
      </div>
      {verdict && !verdict.ok && onExplain && (
        <button
          type="button"
          className="cod-explain-pill"
          onClick={(e) => {
            e.stopPropagation();
            onExplain();
          }}
        >
          Explain
        </button>
      )}
      {verdict && verdict.ok && (
        <p className="detail-solved-note">✓ Locked in. Keep hunting.</p>
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

export default function FindScreen({ testData, mode, onExit }) {
  const timed = mode === "timed";
  const questions = testData ? testData.questions : [];
  const total = questions.length;
  const [qIndex, setQIndex] = useState(0);
  const [picks, setPicks] = useState({});
  const [flags, setFlags] = useState({});
  const [paces, setPaces] = useState({});
  const [verdicts, setVerdicts] = useState({});
  const [attempts, setAttempts] = useState({});
  const [flash, setFlash] = useState(null);
  const [phase, setPhase] = useState("take");
  const [elapsed, setElapsed] = useState(0);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPinned, setAiPinned] = useState(true);
  const [aiCtx, setAiCtx] = useState(null);

  /* While Codino is open, follow the active question so every chat message
     carries the current stem, pick, expected span + passage. */
  useEffect(() => {
    if (!aiOpen || !testData || !testData.questions.length) return;
    const cur = testData.questions[Math.min(qIndex, testData.questions.length - 1)];
    if (!cur) return;
    setAiCtx((prev) => {
      if (!prev || !prev.q || prev.q.n === cur.n) return prev;
      return {
        ...prev,
        q: { ...cur, options: [] },
        autoAsk: undefined,
      };
    });
  }, [aiOpen, qIndex, testData]);
  const [ovFilter, setOvFilter] = useState("All");
  const [paused, setPaused] = useState(false);
  const [hlPop, setHlPop] = useState(null);
  const [ptimeOpen, setPtimeOpen] = useState(false);
  const [ptimers, setPtimers] = useState({});
  const [ptimeMuted, setPtimeMuted] = useState(false);
  const ptimeMutedRef = useRef(false);
  const [hoverCap] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.matchMedia &&
      window.matchMedia("(hover: hover)").matches
  );
  const passageWrapRef = useRef(null);
  const pendingHl = useRef(null);
  const flashT = useRef(null);
  const ptimersRef = useRef({});
  const ptimeCloseT = useRef(null);

  const togglePause = () => {
    setPaused((p) => {
      pausedRef.current = !p;
      return !p;
    });
  };
  const elapsedRef = useRef(0);
  const enterRef = useRef(0);
  const prevPassageRef = useRef(null);
  const prevQRef = useRef(null);
  const pausedRef = useRef(false);
  /* Mirror of paces state for use inside interval/effects without stale closures. */
  const pacesRef = useRef({});

  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current) return;
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(
    () => () => {
      if (flashT.current) clearTimeout(flashT.current);
    },
    []
  );

  const autoDoneRef = useRef(false);
  const limit = Math.max(60, Math.round(Number(testData && testData.timeMinutes) || 8) * 60);
  const remaining = Math.max(0, limit - elapsed);

  // Hooks must all run before any early return below: finishing only flips
  // phase, so the done view renders with an identical hook order.
  useEffect(() => {
    if (timed && remaining === 0 && !autoDoneRef.current && total > 0) {
      autoDoneRef.current = true;
      const activeN = prevQRef.current;
      const delta = elapsedRef.current - enterRef.current;
      if (activeN !== null && activeN !== undefined && delta > 0) {
        pacesRef.current = { ...pacesRef.current, [activeN]: (pacesRef.current[activeN] || 0) + delta };
        setPaces({ ...pacesRef.current });
      }
      enterRef.current = elapsedRef.current;
      setPhase("done");
    }
  }, [timed, remaining, total]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || "";
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || (e.target && e.target.isContentEditable)) return;
      if ((e.ctrlKey || e.metaKey || e.shiftKey) && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        if (aiOpen) setAiOpen(false);
        else openAsk();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setQIndex((i) => Math.min(i + 1, total - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setQIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setOverviewOpen((v) => !v);
      } else if (e.key === "ArrowDown") {
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          e.preventDefault();
          setPhase("done");
          window.scrollTo(0, 0);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => () => {
    if (ptimeCloseT.current) clearTimeout(ptimeCloseT.current);
  }, []);

  const openPtime = () => {
    if (ptimeCloseT.current) {
      clearTimeout(ptimeCloseT.current);
      ptimeCloseT.current = null;
    }
    setPtimeOpen(true);
  };

  const schedulePtimeClose = () => {
    if (ptimeCloseT.current) clearTimeout(ptimeCloseT.current);
    ptimeCloseT.current = setTimeout(() => {
      setPtimeOpen(false);
      ptimeCloseT.current = null;
    }, 220);
  };

  useEffect(() => {
    const id = setInterval(() => {
      const cur = ptimersRef.current;
      const ids = Object.keys(cur).filter((k) => cur[k].running && cur[k].remaining > 0);
      if (ids.length === 0) return;
      const next = { ...cur };
      ids.forEach((k) => {
        const t = next[k];
        const remaining = Math.max(0, Math.round((t.remaining - 0.5) * 10) / 10);
        if (remaining === 0) {
          next[k] = { ...t, remaining, running: false };
          if (!ptimeMutedRef.current) tripleTick();
        } else {
          next[k] = { ...t, remaining };
          if (!ptimeMutedRef.current) tickSound();
        }
      });
      ptimersRef.current = next;
      setPtimers(next);
    }, 500);
    return () => clearInterval(id);
  }, []);

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
    /* Leaving a question: bank the time spent on it into its pace. */
    const leavingN = prevQRef.current;
    if (leavingN !== null && leavingN !== undefined) {
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

  if (!testData || total === 0) {
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

  if (phase === "done") {
    const solved = questions.filter((q) => verdicts[q.n] && verdicts[q.n].ok).length;
    return (
      <div className="test">
        <div className="detail-done rise">
          <div className="detail-done-count ring-pop">
            {solved}/{total}
          </div>
          <h2 className="detail-done-title">Finding complete</h2>
          <p className="muted-text">
            {solved === total
              ? "Flawless — every span nailed."
              : solved === 0
                ? "No spans cracked yet — run it back."
                : "Sharp eyes. Review the misses below, then run it back."}
          </p>
          <div className="detail-done-list">
            {questions.map((q) => {
              const v = verdicts[q.n];
              const pk = picks[q.n];
              return (
                <div key={q.n} className={v && v.ok ? "detail-done-row ok" : "detail-done-row no"}>
                  <span className="q-badge sm">{q.n}</span>
                  <span className="detail-done-stem">{q.stem}</span>
                  <span className={v && v.ok ? "detail-verdict ok" : "detail-verdict no"}>
                    {v && v.ok ? "✓ Found" : pk ? "✕ Missed" : "— Skipped"}
                  </span>
                  <button
                    type="button"
                    className="go-btn"
                    onClick={() => {
                      setPhase("take");
                      goTo(q.n);
                    }}
                  >
                    GO
                  </button>
                </div>
              );
            })}
          </div>
          <div className="detail-done-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setPicks({});
                setVerdicts({});
                setAttempts({});
                setFlash(null);
                setQIndex(0);
                elapsedRef.current = 0;
                setElapsed(0);
                autoDoneRef.current = false;
                setPhase("take");
                window.scrollTo(0, 0);
              }}
            >
              RETRY SET
            </button>
            <button type="button" className="nav-btn" onClick={onExit}>
              EXIT
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeQ = questions[Math.min(qIndex, total - 1)];
  const passage = testData.passages.find((p) => p.id === activeQ.p);
  const picked = picks[activeQ.n] || null;
  const flagged = !!flags[activeQ.n];
  const verdict = verdicts[activeQ.n] || null;
  const tried = attempts[activeQ.n] || 0;
  const answerParas = new Set((activeQ.answers || []).map((a) => a && a.para));
  const hints = (activeQ.refs || []).filter(
    (r) => r && Number.isInteger(r.para) && !answerParas.has(r.para)
  );
  const isReading = true;
  const pt = ptimers[passage.id] || ptBlank();
  const ptTop = pt;
  const ptFrac = pt.total > 0 ? pt.remaining / pt.total : 0;
  const answeredCount = questions.filter((q) => picks[q.n]).length;
  const answeredFrac = total ? answeredCount / total : 0;
  const fillClass = answeredFrac < 0.34 ? "fill-low" : answeredFrac < 0.67 ? "fill-mid" : "";
  const solvedCount = questions.filter((q) => verdicts[q.n] && verdicts[q.n].ok).length;

  const expired = timed && remaining === 0;

  const choosePick = () => {
    const pend = pendingHl.current;
    const wrap = passageWrapRef.current;
    setHlPop(null);
    pendingHl.current = null;
    if (!pend || !wrap || !passage) {
      dropSelection();
      return;
    }
    let range = null;
    try {
      const sel = document.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        dropSelection();
        return;
      }
      range = sel.getRangeAt(0);
      if (!wrap.contains(range.commonAncestorContainer)) {
        dropSelection();
        return;
      }
    } catch {
      dropSelection();
      return;
    }
    const pEl = wrap.querySelector(`[data-para="${pend.para}"]`);
    const paraText = passage.paras[pend.para];
    if (!pEl || typeof paraText !== "string") {
      dropSelection();
      return;
    }
    // Offsets are exact: finding paras render as raw text only.
    const pre = range.cloneRange();
    pre.selectNodeContents(pEl);
    try {
      pre.setEnd(range.startContainer, range.startOffset);
    } catch {
      dropSelection();
      return;
    }
    const s = pre.toString().length;
    const e = s + range.toString().length;
    if (!(e > s)) {
      dropSelection();
      return;
    }
    const n = activeQ.n;
    setPicks((m) => ({ ...m, [n]: { para: pend.para, s, e, text: paraText.slice(s, e) } }));
    setVerdicts((m) => {
      if (!m[n]) return m;
      const next = { ...m };
      delete next[n];
      return next;
    });
    dropSelection();
  };

  const clearPick = () => {
    const n = activeQ.n;
    setPicks((m) => {
      if (!m[n]) return m;
      const next = { ...m };
      delete next[n];
      return next;
    });
    setVerdicts((m) => {
      if (!m[n]) return m;
      const next = { ...m };
      delete next[n];
      return next;
    });
  };

  const check = () => {
    if (paused || !passage || !picked) return;
    const r = scoreSelection(passage.paras, activeQ.answers || [], picked);
    const n = activeQ.n;
    setAttempts((m) => ({ ...m, [n]: (m[n] || 0) + 1 }));
    setVerdicts((m) => ({ ...m, [n]: { ok: r.correct } }));
    if (!r.correct) {
      if (flashT.current) clearTimeout(flashT.current);
      setFlash({ ok: false, key: `${n}-${Date.now()}` });
      flashT.current = setTimeout(() => {
        setFlash(null);
        flashT.current = null;
      }, 1400);
    }
    window.console.debug("find check", { n, correct: r.correct, recall: r.recall, precision: r.precision });
  };

  const openExplain = () => {
    if (!activeQ || !passage) return;
    const p = picks[activeQ.n] || null;
    const exp = (activeQ.answers || [])
      .map((a) => `"${a.text}" (paragraph ${(a.para || 0) + 1})`)
      .join("; ");
    setAiCtx({
      testData,
      q: { ...activeQ, options: [] },
      pickedLetter: null,
      letters: [],
      reveal: true,
      autoAsk:
        `Explain finding question ${activeQ.n} (${activeQ.tag}) step by step. ` +
        `Stem: ${activeQ.stem} ` +
        `Expected answer span: ${exp}. ` +
        `Student selected: "${p ? p.text : "(nothing)"}". ` +
        `Official note: ${activeQ.explain || "none"}. ` +
        `Show why the expected span answers the stem and why the student's selection misses.`,
    });
    setAiPinned(false);
    setAiOpen(true);
  };

  const openAsk = () => {
    setAiCtx({
      testData,
      q: { ...activeQ, options: [] },
      pickedLetter: null,
      letters: [],
      reveal: false,
    });
    setAiPinned(true);
    setAiOpen(true);
  };

  const setPt = (pid, patch) => {
    const cur = ptimersRef.current[pid] || ptBlank();
    const next = { ...ptimersRef.current, [pid]: { ...cur, ...patch } };
    ptimersRef.current = next;
    setPtimers(next);
  };

  const bumpPtime = (delta) => {
    if (!passage) return;
    const t = ptimersRef.current[passage.id] || ptBlank();
    const total = Math.min(3600, Math.max(60, t.total + delta));
    setPt(passage.id, { total, remaining: Math.min(Math.max(0, t.remaining + delta), total) });
  };

  const togglePtime = () => {
    if (!passage) return;
    ensureAudio();
    const t = ptimersRef.current[passage.id] || ptBlank();
    if (t.remaining === 0) setPt(passage.id, { remaining: t.total, running: true, started: true });
    else setPt(passage.id, { running: !t.running, started: true });
  };

  const resetPtime = () => {
    if (!passage) return;
    const t = ptimersRef.current[passage.id] || ptBlank();
    setPt(passage.id, { remaining: t.total, running: false, started: false });
  };

  const togglePtimeMute = () => {
    const v = !ptimeMutedRef.current;
    ptimeMutedRef.current = v;
    setPtimeMuted(v);
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

  const goTo = (n) => {
    const idx = questions.findIndex((q) => q.n === n);
    if (idx >= 0) setQIndex(idx);
  };

  const commitActivePace = () => {
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
    commitActivePace();
    setPhase("done");
    window.scrollTo(0, 0);
  };

  const livePace = (n) => {
    if (n !== activeQ.n) return paces[n];
    const running = elapsed - enterRef.current;
    return (paces[n] || 0) + Math.max(0, running);
  };

  return (
    <div className={aiOpen && aiPinned ? "test cod-docked" : "test"}>
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
            <div className={expired ? "test-timer danger" : paused ? "test-timer paused" : "test-timer"}>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 4.8V8l2.4 1.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span>{formatClock(remaining)}</span>
            </div>
          </div>
        )}
        <div className="test-right">
          {isReading && (
            <div
              className="ptime-wrap"
              onMouseEnter={hoverCap ? openPtime : undefined}
              onMouseLeave={hoverCap ? schedulePtimeClose : undefined}
            >
              <button
                className={ptimeOpen ? "ptime-btn on" : "ptime-btn"}
                type="button"
                onClick={() => setPtimeOpen((v) => !v)}
                title="Passage timer"
                aria-label="Passage timer"
                aria-expanded={ptimeOpen}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path
                    d="M8 4.8V8l2.4 1.4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                {ptTop.started && <span>{formatClock(Math.ceil(ptTop.remaining))}</span>}
              </button>
              {ptimeOpen && (
                <>
                  {!hoverCap && (
                    <div className="ptime-catcher" onClick={() => setPtimeOpen(false)} />
                  )}
                  <div
                    className={pt.remaining <= 60 ? "ptime-card low" : "ptime-card"}
                    role="dialog"
                    aria-label="Passage timer"
                  >
                    <div className="ptime-ring-wrap">
                      <svg
                        className="ptime-ring"
                        width="132"
                        height="132"
                        viewBox="0 0 132 132"
                        aria-hidden="true"
                      >
                        <circle cx="66" cy="66" r="54" className="ptime-track" />
                        <circle
                          cx="66"
                          cy="66"
                          r="54"
                          className="ptime-arc"
                          style={{ strokeDashoffset: PT_CIRC * (1 - ptFrac) }}
                        />
                      </svg>
                      <div className="ptime-center">
                        <span className="ptime-digits">{formatClock(Math.ceil(pt.remaining))}</span>
                        <span className="ptime-cap">
                          {pt.running ? "ticking" : pt.remaining === 0 ? "time's up" : "paused"}
                        </span>
                      </div>
                    </div>
                    <div className="ptime-controls">
                      <button type="button" className="ptime-adj" onClick={() => bumpPtime(-60)}>
                        −1:00
                      </button>
                      <button
                        type="button"
                        className={pt.running ? "ptime-main pause" : "ptime-main"}
                        onClick={togglePtime}
                      >
                        {pt.running ? "PAUSE" : "START"}
                      </button>
                      <button type="button" className="ptime-adj" onClick={() => bumpPtime(60)}>
                        +1:00
                      </button>
                    </div>
                    <button type="button" className="ptime-reset" onClick={resetPtime}>
                      Reset to {formatClock(pt.total)}
                    </button>
                    <button
                      type="button"
                      className={ptimeMuted ? "ptime-sound off" : "ptime-sound"}
                      onClick={togglePtimeMute}
                      aria-pressed={!ptimeMuted}
                    >
                      {ptimeMuted ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                          <path d="M2 5v4h2.5L8 12V2L4.5 5H2z" fill="currentColor" />
                          <line x1="9.5" y1="4.5" x2="12.5" y2="9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          <line x1="12.5" y1="4.5" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                          <path d="M2 5v4h2.5L8 12V2L4.5 5H2z" fill="currentColor" />
                          <path
                            d="M9.5 4.5a3.5 3.5 0 0 1 0 5M11.5 2.8a6 6 0 0 1 0 8.4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                      <span>{ptimeMuted ? "Sound off" : "Sound on"}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          <div className="test-progress">
            <span className="test-progress-label">
              Found {solvedCount} of {total}
            </span>
            <span className="test-progress-track">
              <span
                className={`test-progress-fill ${fillClass}`}
                style={{ width: `${total ? (solvedCount / total) * 100 : 0}%` }}
              />
            </span>
          </div>
        </div>
      </header>

      <div className="test-body">
        <article className="passage">
          <h1 className="passage-title">{passage.title}</h1>
          {picked && (
            <div className="hl-bar">
              <button type="button" className="hl-clear" onClick={clearPick}>
                Clear pick · ¶{picked.para + 1}
              </button>
            </div>
          )}
          <div className="passage-text" ref={passageWrapRef}>
            {passage.paras.map((pa, i) => (
              <p key={`${passage.id}-${i}`} data-para={i}>
                {renderParaText(
                  pa,
                  hints.filter((r) => r.para === i),
                  picked && picked.para === i ? [{ s: picked.s, e: picked.e }] : [],
                  clearPick
                )}
              </p>
            ))}
          </div>
        </article>

        <aside className="question-panel">
          <section className="q-card" aria-label={`Question ${activeQ.n}`}>
            <FindBits
              q={activeQ}
              pick={picked}
              paused={paused}
              flagged={flagged}
              tried={tried}
              verdict={verdict}
              onToggleFlag={toggleFlag}
              onCheck={check}
              onClearPick={clearPick}
              onExplain={openExplain}
            />
          </section>
          {flash && (
            <div key={flash.key} className={flash.ok ? "detail-flash ok" : "detail-flash no"} role="status">
              <span className="detail-flash-mark">{flash.ok ? "✓" : "✕"}</span>
              <span>{flash.ok ? "Correct — sharp eyes." : "Not quite — try again."}</span>
            </div>
          )}
        </aside>
      </div>

      <div className="test-nav">
        <div className="test-nav-inner">
          <FindBtn
            className="light"
            onClick={() => setQIndex(qIndex - 1)}
            disabled={qIndex === 0}
          >
            <span className="find-arrow" aria-hidden="true">‹</span> Back
          </FindBtn>
          <span className="nav-count">
            {`${qIndex + 1} of ${total}`}
          </span>
          {qIndex === total - 1 ? (
            <button
              className="nav-btn primary"
              type="button"
              onClick={handleFinish}
            >
              FINISH
            </button>
          ) : (
            <FindBtn className="light" onClick={() => setQIndex(qIndex + 1)}>
              Next <span className="find-arrow" aria-hidden="true">›</span>
            </FindBtn>
          )}
          <button
            className={aiOpen ? "cod-nav-btn on" : "cod-nav-btn"}
            type="button"
            onClick={() => (aiOpen ? setAiOpen(false) : openAsk())}
            title={aiOpen ? "Close Codino AI" : "Ask Codino AI"}
            aria-label={aiOpen ? "Close Codino AI" : "Ask Codino AI"}
            aria-pressed={aiOpen}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                d="M9 1.5c-3.6 0-6 2.8-6 6 0 1.9.9 3.5 2.3 4.6L4.8 15l2.9-1.3c.4.1.8.1 1.3.1 3.6 0 6-2.8 6-6s-2.4-6.3-6-6.3z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M10.2 5.2l-2.4 3.1h1.7l-.6 2.5 2.4-3.1H9.6z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>

      {hlPop && (
        <button
          type="button"
          className="hl-pop"
          style={{ left: hlPop.x, top: hlPop.y }}
          onMouseDown={(e) => e.preventDefault()}
          onClick={choosePick}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M9.7 1.3l3 3L5.2 11.8l-3.7.7.7-3.7z" fill="currentColor" />
          </svg>
          <span>Choose</span>
        </button>
      )}

      <CodinoPanel
        open={aiOpen}
        pinned={aiPinned}
        onTogglePin={() => setAiPinned((v) => !v)}
        context={aiCtx}
        onClose={() => setAiOpen(false)}
      />
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
              {visibleQs.map((q) => {
                const v = verdicts[q.n];
                const st = v ? (v.ok ? "answered" : "marked") : statusOf(q.n);
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
                        {v ? (v.ok ? "Found" : "Missed") : STATUS_LABEL[st]}
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
            <div className="ov-finish">
              <button
                className="finish-btn"
                type="button"
                onClick={() => {
                  setOverviewOpen(false);
                  handleFinish();
                }}
              >
                FINISH THIS SET
              </button>
            </div>
        </aside>
        </div>
      )}
    </div>
  );
}
