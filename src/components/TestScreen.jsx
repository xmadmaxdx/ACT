import { useEffect, useRef, useState } from "react";
import MathText, { mathRich } from "./MathText.jsx";
import MathFigure from "./MathFigure.jsx";
import LatexBlock from "./LatexBlock.jsx";
import { healOption } from "../latexHeal.js";
import StrategyPanel, { BulbIcon } from "./StrategyPanel.jsx";
import SaveLink from "./SaveLink.jsx";
import FreestyleBoard from "./FreestyleBoard.jsx";
import CodinoPanel from "../ai/CodinoPanel.jsx";
import { DesmosCalc, preloadDesmos } from "./DesmosCalc.jsx";
import { lettersFor } from "../scoring.js";
import { FIGURE_PRESETS } from "../theoryFigures.js";

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

const ORDINAL = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6,
  seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12,
  thirteenth: 13, fourteenth: 14, fifteenth: 15, sixteenth: 16,
  seventeenth: 17, eighteenth: 18, nineteenth: 19, twentieth: 20,
};

/* Official highlights derived from the question stem itself — no JSON refs.
   Quoted "words" light up wherever they appear in the passage; ordinal
   mentions (6th paragraph, sixth paragraph, final/last paragraph) light the
   whole paragraph. Returns refs-shaped entries for renderParaText. */
function stemRefs(paras, stem) {
  const refs = [];
  if (!stem) return refs;
  const s = String(stem);
  const seen = new Set();
  const qre = /"([^"]+)"|“([^”]+)”/g;
  let m;
  const cands = [];
  while ((m = qre.exec(s)) !== null) {
    const q = (m[1] || m[2] || "").trim();
    if (q.length < 2) continue;
    const key = q.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    paras.forEach((p, i) => {
      if (typeof p !== "string") return;
      const hit = findQuote(p, q, 0);
      if (hit) cands.push({ para: i, text: q, len: hit[1] - hit[0] });
    });
  }
  // Many paras can contain the quote: light only the single largest match.
  if (cands.length > 0) {
    let best = cands[0];
    for (let k = 1; k < cands.length; k++) {
      if (cands[k].len > best.len) best = cands[k];
    }
    refs.push({ para: best.para, text: best.text });
  }
  const whole = new Set();
  const ore = /\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|last|final|\d+(?:st|nd|rd|th))\s+paragraphs?\b/gi;
  let o;
  while ((o = ore.exec(s)) !== null) {
    const word = o[1].toLowerCase();
    let n = ORDINAL[word];
    if (word === "last" || word === "final") n = paras.length;
    else if (n === undefined) n = parseInt(word, 10);
    if (!Number.isInteger(n) || n < 1 || n > paras.length) continue;
    if (whole.has(n - 1)) continue;
    whole.add(n - 1);
    refs.push({ para: n - 1 });
  }
  return refs;
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

function optParts(opt) {
  if (opt && typeof opt === "object") {
    return {
      t: String(opt.t || ""),
      svg: typeof opt.svg === "string" && opt.svg.indexOf("<svg") >= 0 ? opt.svg : null,
    };
  }
  return { t: String(opt || ""), svg: null };
}

function optText(opt) {
  const { t, svg } = optParts(opt);
  const healed = healOption(t);
  const label =
    healed === "" ? null : t === "No Change" ? <strong>No Change</strong> : mathRich(healed);
  if (!svg) return label;
  return (
    <>
      {label ? <span className="q-text-label">{label}</span> : null}
      <span
        className="q-opt-figure"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </>
  );
}

/* Question-level figure (math linked sets): figures map values are raw SVG
   strings (legacy) or declarative objects rendered by MathFigure. Unknown
   ids render nothing, never crash. */
function QuestionFigure({ q, figures }) {
  const id = q && q.figure;
  if (!id || !figures) return null;
  const entry = figures[id];
  if (typeof entry === "string") {
    if (entry.indexOf("<svg") < 0) return null;
    return (
      <span
        className="passage-figure"
        dangerouslySetInnerHTML={{ __html: entry }}
      />
    );
  }
  if (entry && typeof entry === "object" && !Array.isArray(entry)) {
    return <MathFigure fig={{ ...entry, id }} />;
  }
  return null;
}

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

/* Passage spans: {t} plain text (may include $LaTeX$), {u, t} tested
   underline keyed by question number, {box} reference point, {fig}
   embedded SVG figure id resolved from the test's figures map, {svg}
   inline SVG code written directly in the span. The active
   question's span lights up; boxed points light up when the active question
   anchors to them via its "point" field — except Placement questions, which
   must never light a box (the lit box would give away the answer). */
function renderSpans(spans, q, figures) {
  const isPlacement = /placement/i.test(q.tag || "");
  return spans.map((s, i) => {
    if (s.svg !== undefined) {
      if (typeof s.svg !== "string" || s.svg.indexOf("<svg") < 0) return null;
      return (
        <span
          key={i}
          className="passage-figure"
          dangerouslySetInnerHTML={{ __html: s.svg }}
        />
      );
    }
    if (s.fig !== undefined) {
      const entry = figures && figures[s.fig];
      if (typeof entry === "string") {
        if (entry.indexOf("<svg") < 0) return null;
        return (
          <span
            key={i}
            className="passage-figure"
            dangerouslySetInnerHTML={{ __html: entry }}
          />
        );
      }
      if (entry && typeof entry === "object" && !Array.isArray(entry)) {
        return (
          <span key={i} className="passage-figure">
            <MathFigure fig={{ ...entry, id: s.fig }} />
          </span>
        );
      }
      return null;
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

function QBits({ q, picked, showAnswers, paused, flagged, serifStem, onPick, onToggleFlag, letters, elimActive, elimSet, onToggleElim, onExplain }) {
  const L = letters && letters.length === 4 ? letters : LETTERS;
  return (
    <>
      <div className="q-head">
        <span className="q-num">{q.n}</span>
        <button
          type="button"
          className={flagged ? "q-flag on" : "q-flag"}
          onClick={onToggleFlag}
          aria-pressed={flagged}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M3.5 14.5v-12M3.5 3c3-2 5.5 2 9 0v7c-3.5 2-6-2-9 0"
              fill={flagged ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{flagged ? "Flagged for review" : "Mark for Review"}</span>
        </button>
      </div>
      {q.stem ? (
        serifStem ? (
          <div className="passage-text merged-stem">
            <p>{renderStem(q.stem)}</p>
          </div>
        ) : (
          <p className="q-stem">{renderStem(q.stem)}</p>
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
              {showAnswers && picked === letter && onExplain && (
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
    </>
  );
}

function renderTheoryBlock(b, i) {
  if (!b || typeof b !== "object") return null;
  if (b.h) return <h4 key={i} className="lesson-h">{b.h}</h4>;
  if (b.math) return <div key={i} className="lesson-math"><LatexBlock tex={b.math} label="Math block needs a fix" /></div>;
  if (b.list) {
    return (
      <ul key={i} className="lesson-list">
        {b.list.map((t, j) => (
          <li key={j}><MathText text={t} /></li>
        ))}
      </ul>
    );
  }
  if (b.formula) {
    return (
      <div key={i} className="formula-box">
        <LatexBlock tex={b.formula} label="Formula needs a fix" />
      </div>
    );
  }
  if (b.versus && Array.isArray(b.versus)) {
    const cells = b.versus.filter(
      (s) => s && typeof s === "object" && (s.shape || s.svg || s.title || s.text)
    );
    if (cells.length >= 2) {
      const shown = cells.slice(0, 3);
      return (
        <div key={i} className="versus-grid">
          {shown.map((side, k) => {
            const preset =
              typeof side.shape === "string" ? FIGURE_PRESETS[side.shape] : null;
            const svg =
              preset ||
              (typeof side.svg === "string" && side.svg.indexOf("<svg") >= 0
                ? side.svg
                : null);
            return (
              <div key={k} className="versus-cell">
                {svg ? (
                  <div
                    className="versus-figure"
                    dangerouslySetInnerHTML={{ __html: svg }}
                  />
                ) : null}
                {side.title ? <p className="versus-title">{side.title}</p> : null}
                {side.text ? (
                  <div className="versus-text"><MathText text={String(side.text)} /></div>
                ) : null}
              </div>
            );
          })}
        </div>
      );
    }
  }
  if (b.table && Array.isArray(b.table.rows)) {
    const head = Array.isArray(b.table.head) ? b.table.head : [];
    return (
      <figure key={i} className="theory-table-wrap">
        {b.table.caption ? <figcaption className="theory-table-cap">{b.table.caption}</figcaption> : null}
        <table className="theory-table">
          {head.length > 0 && (
            <thead>
              <tr>
                {head.map((h, j) => (
                  <th key={j} scope="col"><MathText text={String(h)} /></th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {b.table.rows.map((row, r) => (
              <tr key={r}>
                {(Array.isArray(row) ? row : [row]).map((cell, j) => (
                  <td key={j}><MathText text={String(cell)} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </figure>
    );
  }
  if (b.example) {
    const ex = b.example;
    return (
      <div key={i} className="example-box">
        <p className="example-kicker">{ex.title || "Worked example"}</p>
        <div className="example-problem"><MathText text={String(ex.problem || "")} /></div>
        {ex.solution ? (
          <details className="example-solution">
            <summary>Show solution</summary>
            <div className="example-answer"><MathText text={String(ex.solution)} /></div>
          </details>
        ) : null}
      </div>
    );
  }
  if (b.tip || b.warn || b.note || b.def) {
    const kind = b.tip ? "tip" : b.warn ? "warn" : b.note ? "note" : "def";
    const label = b.tip ? "Tip" : b.warn ? "Watch out" : b.note ? "Note" : "Definition";
    return (
      <div key={i} className={`tbox ${kind}`}>
        <p className="tbox-label">{label}</p>
        <div className="tbox-body"><MathText text={String(b[kind])} /></div>
      </div>
    );
  }
  return <p key={i} className="lesson-p"><MathText text={b.p || ""} /></p>;
}

export default function TestScreen({ test, session, startIndex, review, findTest, customTestData, hideSave, onFinish, onExit }) {
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
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPinned, setAiPinned] = useState(true);
  const [aiCtx, setAiCtx] = useState(null);
  const [stratOpen, setStratOpen] = useState(false);

  /* While Codino is open, follow the active question so every chat message
     carries the current stem, options, pick, answer, explanation + passage. */
  useEffect(() => {
    if (!aiOpen || !testData || !testData.questions.length) return;
    const cur = testData.questions[Math.min(qIndex, testData.questions.length - 1)];
    if (!cur) return;
    setAiCtx((prev) => {
      if (!prev || !prev.q || prev.q.n === cur.n) return prev;
      return {
        ...prev,
        q: cur,
        pickedLetter: (picks || {})[cur.n] || null,
        letters: lettersFor(cur.n, testData.section),
        autoAsk: undefined,
      };
    });
  }, [aiOpen, qIndex, picks, testData]);
  const [ovFilter, setOvFilter] = useState("All");
  const [paused, setPaused] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcMode, setCalcMode] = useState("graph");
  const [calcFull, setCalcFull] = useState(false);
  /* Question/calc split as grid weights (default 3:2, questions 60 / calc 40).
     Passage/questions split as grid weights (default 3:2, passage 60 /
     questions 40). Ratios track body width automatically, so rails, resizes,
     and Desmos never fight. Drag writes pixel widths; both sides share the
     same unit so fr proportions stay exact. */
  const [calcSplit, setCalcSplit] = useState({ q: 3, c: 2 });
  const [paneSplit, setPaneSplit] = useState({ p: 3, q: 2 });
  const [elimOn, setElimOn] = useState(true);
  const [elims, setElims] = useState({});
  const [marks, setMarks] = useState({});
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
  /* Narrow (phone) screens hide the eliminator toggle to free bottom-bar
     space, so elimination stays forced on there. */
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.matchMedia &&
      window.matchMedia("(max-width: 700px)").matches
  );
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 700px)");
    const onChange = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);
  const passageWrapRef = useRef(null);
  const paraRefs = useRef(new Map());
  const pendingHl = useRef(null);
  const marksRef = useRef({});
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
    if (((testData && testData.section) || "").toLowerCase() !== "reading") return;
    const cur = questions[Math.min(qIndex, total - 1)];
    if (!cur) return;
    const pd = (testData.passages || []).find((p) => p.id === cur.p);
    const paras = pd ? pd.paras : [];
    const auto = stemRefs(paras, cur.stem).map((r) => r.para);
    if (auto.length === 0) return;
    const target = Math.min(...auto);
    const el = paraRefs.current.get(`${cur.p}-${target}`);
    if (!el) return;
    const reduce =
      typeof window !== "undefined" &&
      !!window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      /* Passage is its own scroll pane on desktop: scroll it, not the window.
         Falls back to window scrolling when the pane cannot scroll (mobile
         stacked layout, calculator-split merged mode). */
      const scroller =
        passageWrapRef.current && passageWrapRef.current.parentElement;
      if (scroller && scroller.scrollHeight > scroller.clientHeight + 1) {
        const srect = scroller.getBoundingClientRect();
        const rect = el.getBoundingClientRect();
        const rel = rect.top - srect.top;
        if (rel >= 16 && rect.bottom <= srect.bottom - 16) return;
        scroller.scrollTo({
          top: Math.max(0, scroller.scrollTop + rel - 16),
          behavior: reduce ? "auto" : "smooth",
        });
        return;
      }
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      if (rect.top >= 96 && rect.bottom <= vh - 40) return;
      window.scrollTo({
        top: Math.max(0, rect.top + window.scrollY - 96),
        behavior: reduce ? "auto" : "smooth",
      });
    } catch {
      el.scrollIntoView();
    }
  }, [qIndex]);

  useEffect(() => {
    /* Leaving a question: bank the time spent on it into its pace. */
    const leavingN = prevQRef.current;    if (!review && leavingN !== null && leavingN !== undefined) {
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
      try {
        const scroller =
          passageWrapRef.current && passageWrapRef.current.parentElement;
        if (scroller) scroller.scrollTo(0, 0);
      } catch (err) {
        window.console.debug("passage scroll skipped", err);
      }
      window.scrollTo(0, 0);
    }
    prevPassageRef.current = pid;
    prevQRef.current = active ? active.n : null;
    enterRef.current = elapsedRef.current;
    /* Option buttons are keyed by letter, so React reuses the DOM node on
       the next question — a focused option would keep its focus ring and
       look selected there. Drop option focus on every navigation. */
    try {
      const ae = document.activeElement;
      if (ae && ae.closest && ae.closest(".q-options")) ae.blur();
    } catch (err) {
      window.console.debug("option blur skipped", err);
    }
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
  const isReading = ((testData && testData.section) || "").toLowerCase() === "reading";
  const pt = ptimers[passage.id] || ptBlank();
  const ptTop = pt;
  const ptFrac = pt.total > 0 ? pt.remaining / pt.total : 0;
  const showAnswers = review;
  const answeredCount = questions.filter((q) => picks[q.n]).length;
  const answeredFrac = total ? answeredCount / total : 0;
  const fillClass = answeredFrac < 0.34 ? "fill-low" : answeredFrac < 0.67 ? "fill-mid" : "";

  const limit = testData.timeMinutes * 60;
  const remaining = Math.max(0, limit - elapsed);
  const expired = timed && remaining === 0;

  /* Strategy rail: only exists when the question carries data. Either the
     AI rail or the strategy rail may show — never both at once. */
  const hasStrategy = !!(
    activeQ.strategy ||
    (Array.isArray(activeQ.steps) && activeQ.steps.length > 0) ||
    activeQ.solution
  );
  const stratVisible = stratOpen && hasStrategy;

  const toggleStrategy = () => {
    if (!stratOpen) setAiOpen(false);
    setStratOpen(!stratOpen);
  };

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

  const elimActive = (elimOn || isMobile) && !review && !paused;
  const elimSet = elims[activeQ.n] || [];

  const openExplain = (qq) => {
    if (!review) return;
    setStratOpen(false);
    const picked = picks[qq.n] || null;
    const autoAsk = picked
      ? `Explain question ${qq.n} (${qq.tag}): name the correct choice, apply it to this exact passage, and show why my picked choice ${picked} fails. Discuss only my picked choice — do not mention the other choices at all.`
      : `Explain question ${qq.n} (${qq.tag}): name the correct choice and apply it to this exact passage.`;
    setAiCtx({
      testData,
      q: qq,
      pickedLetter: picks[qq.n] || null,
      letters: lettersFor(qq.n, testData.section),
      autoAsk,
    });
    setAiPinned(false);
    setAiOpen(true);
  };

  const openAsk = () => {
    setStratOpen(false);
    setAiCtx({
      testData,
      q: activeQ,
      pickedLetter: picks[activeQ.n] || null,
      letters: qLetters,
      reveal: review,
    });
    setAiPinned(true);
    setAiOpen(true);
  };

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

  const showCalc = /^MATH-/i.test(test.id) || (testData.section || "").toLowerCase() === "math";
  const merged = calcOpen && showCalc;

  const goTo = (n) => {
    const idx = questions.findIndex((q) => q.n === n);
    if (idx >= 0) setQIndex(idx);
    setBrkId(null);
    if (needIntro && !introDoneRef.current) {
      setIntroDone(true);
      introDoneRef.current = true;
    }
  };

  const goToTheory = () => {
    setSlideIdx(0);
    setIntroDone(false);
    introDoneRef.current = false;
    setBrkId(null);
    window.scrollTo(0, 0);
  };

  const completeIntro = () => {
    setIntroDone(true);
    introDoneRef.current = true;
    window.scrollTo(0, 0);
  };

  const [brkId, setBrkId] = useState(null);
  const theoryBreaks =
    !review && testData && Array.isArray(testData.theoryBreaks)
      ? testData.theoryBreaks
          .map((b, k) => ({ ...b, id: `b${b.after}:${k}`, after: b.after }))
          .filter((b) => Number.isInteger(b.after) && Array.isArray(b.blocks))
      : [];
  const breakById = (id) => theoryBreaks.find((b) => b.id === id) || null;
  const breaksAfter = (n) => theoryBreaks.filter((b) => b.after === n);
  const activeBreak = brkId ? breakById(brkId) : null;
  const qIdxOf = (n) => questions.findIndex((q) => q.n === n);

  const stepForward = () => {
    if (activeBreak) {
      const same = breaksAfter(activeBreak.after);
      const k = same.findIndex((b) => b.id === activeBreak.id);
      if (k >= 0 && k < same.length - 1) {
        setBrkId(same[k + 1].id);
        window.scrollTo(0, 0);
        return;
      }
      const next = qIdxOf(activeBreak.after) + 1;
      setBrkId(null);
      if (next < total) {
        setQIndex(next);
        window.scrollTo(0, 0);
      } else {
        handleFinish();
      }
      return;
    }
    const cur = questions[qIndex];
    const due = cur ? breaksAfter(cur.n) : [];
    if (due.length > 0) {
      setBrkId(due[0].id);
      window.scrollTo(0, 0);
      return;
    }
    if (qIndex < total - 1) {
      setQIndex(qIndex + 1);
      window.scrollTo(0, 0);
    }
  };

  const stepBack = () => {
    if (activeBreak) {
      const same = breaksAfter(activeBreak.after);
      const k = same.findIndex((b) => b.id === activeBreak.id);
      if (k > 0) {
        setBrkId(same[k - 1].id);
        window.scrollTo(0, 0);
        return;
      }
      setBrkId(null);
      window.scrollTo(0, 0);
      return;
    }
    if (qIndex === 0) {
      if (needIntro) {
        setSlideIdx(slides.length - 1);
        setIntroDone(false);
        introDoneRef.current = false;
        window.scrollTo(0, 0);
      }
      return;
    }
    const prev = questions[qIndex - 1];
    const due = prev ? breaksAfter(prev.n) : [];
    if (due.length > 0) {
      setQIndex(qIndex - 1);
      setBrkId(due[due.length - 1].id);
      window.scrollTo(0, 0);
      return;
    }
    setQIndex(qIndex - 1);
    window.scrollTo(0, 0);
  };

  const goToBreak = (id) => {
    const b = breakById(id);
    if (!b) return;
    if (needIntro && !introDoneRef.current) {
      setIntroDone(true);
      introDoneRef.current = true;
    }
    const idx = qIdxOf(b.after);
    if (idx >= 0) setQIndex(idx);
    setBrkId(id);
    setOverviewOpen(false);
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
      const parts = optParts(opt);
      const label = clean(parts.t);
      lines.push(`${qLetters[i]}. ${label}${label && parts.svg ? " " : ""}${parts.svg ? "[diagram]" : ""}`);
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
      const c = Math.round(rect.right - ev.clientX - 12);
      const q = Math.round(ev.clientX - rect.left);
      if (c < 260 || q < 260) return;
      setCalcSplit({ q, c });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const openCalc = () => {
    setCalcSplit({ q: 3, c: 2 });
    setCalcOpen(true);
  };

  const resetCalc = () => {
    setCalcSplit({ q: 3, c: 2 });
  };

  const startPaneDrag = (e) => {
    e.preventDefault();
    const move = (ev) => {
      const body = bodyRef.current;
      if (!body) return;
      const rect = body.getBoundingClientRect();
      const p = Math.round(ev.clientX - rect.left);
      const q = Math.round(rect.right - ev.clientX - 10);
      if (p < 300 || q < 340) return;
      setPaneSplit({ p, q });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const resetPane = () => {
    setPaneSplit({ p: 3, q: 2 });
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

  /* Eliminator lives on the right in the old layout, or on the left next
     to copy when the strategy button takes the right slot. Defined after
     onIntro/activeBreak — reading them earlier throws a TDZ ReferenceError. */
  const elimBtn = !review && !activeBreak && !onIntro && (
    <button
      className={["elim-toggle", hasStrategy && "left", elimOn && "on"].filter(Boolean).join(" ")}
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
  );

  /* Strategy rail always resets to closed on any navigation — next,
     back, break, or intro slide. It only opens via S key or icon tap. */
  useEffect(() => {
    setStratOpen(false);
  }, [qIndex, brkId, slideIdx, introDone]);

  useEffect(() => {
    const onKey = (e) => {
      if (calcFull) return;
      const tag = (e.target && e.target.tagName) || "";
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || (e.target && e.target.isContentEditable)) return;
      if ((e.ctrlKey || e.metaKey || e.shiftKey) && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        if (aiOpen) setAiOpen(false);
        else openAsk();
        return;
      }
      const inIntro = needIntro && !introDoneRef.current;
      if ((e.key === "s" || e.key === "S") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (inIntro || activeBreak || !hasStrategy) return;
        toggleStrategy();
        return;
      }
      const plain = !e.ctrlKey && !e.metaKey && !e.altKey;
      const goRight = e.key === "ArrowRight" || ((e.key === "d" || e.key === "D") && plain);
      const goLeft = e.key === "ArrowLeft" || ((e.key === "a" || e.key === "A") && plain);
      if (goRight) {
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
        stepForward();
      } else if (goLeft) {
        e.preventDefault();
        if (inIntro) {
          if (slideIdx > 0) {
            setSlideIdx(slideIdx - 1);
            window.scrollTo(0, 0);
          }
          return;
        }
        stepBack();
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
        } else if (showCalc) {
          e.preventDefault();
          if (calcOpen) setCalcOpen(false);
          else openCalc();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    if (!showCalc || review) return;
    if (onIntro || activeBreak) {
      setCalcOpen(false);
      setCalcFull(false);
    } else {
      setCalcOpen(true);
    }
  }, [showCalc, review, onIntro, brkId, qIndex]);

  return (
    <div className={(aiOpen && aiPinned) || stratVisible ? "test cod-docked" : "test"}>
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
        <div className="test-right">
          {!hideSave && <SaveLink testData={testData} />}
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
              Answered {answeredCount} of {total}
            </span>
            <span className="test-progress-track">
              <span
                className={`test-progress-fill ${fillClass}`}
                style={{ width: `${answeredFrac * 100}%` }}
              />
            </span>
          </div>
        </div>
      </header>

      <div
        className={calcOpen && showCalc ? "test-body calc-open" : "test-body"}
        ref={bodyRef}
        style={{
          "--pfr": `${paneSplit.p}fr`,
          "--qpfr": `${paneSplit.q}fr`,
          ...(calcOpen && showCalc
            ? { "--qfr": `${calcSplit.q}fr`, "--cfr": `${calcSplit.c}fr` }
            : null),
        }}
      >
        {onIntro ? (
          <div className="intro-step">
            <div className="intro-card">
              <p className="results-kicker">
                Theory{slides.length > 1 ? ` · ${slideIdx + 1} of ${slides.length}` : ""}
              </p>
              <h1 className="intro-title">{(slides[slideIdx] && slides[slideIdx].heading) || testData.title}</h1>
              <div className="intro-blocks">
                {((slides[slideIdx] && slides[slideIdx].blocks) || []).map((b, i) => renderTheoryBlock(b, i))}
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
        ) : activeBreak ? (
          <div className="intro-step">
            <div className="intro-card">
              <p className="results-kicker">
                Theory · after Question {activeBreak.after}
              </p>
              <h1 className="intro-title">{activeBreak.heading || testData.title}</h1>
              <div className="intro-blocks">
                {(activeBreak.blocks || []).map((b, i) => renderTheoryBlock(b, i))}
              </div>
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
                    stemRefs(passage.paras, activeQ.stem).filter((r) => r.para === i),
                    marksHere.filter((h) => h.para === i),
                    (a, b) => unmarkRange(i, a, b)
                  )}
                </p>
              ) : (
                <p key={`${passage.id}-${i}`}>{renderSpans(pa, activeQ, testData.figures)}</p>
              )
            )}
          </div>
          <QuestionFigure q={activeQ} figures={testData.figures} />
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
                onExplain={() => openExplain(activeQ)}
              />
            </>
          )}
        </article>

        {!merged && (
        <>
        <div
          className="tq-divider"
          onPointerDown={startPaneDrag}
          onDoubleClick={resetPane}
          title="Drag to resize (double-click to reset)"
        >
          <span className="tq-dot" aria-hidden="true" />
        </div>
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
                onExplain={() => openExplain(activeQ)}
              />
          </section>

        </aside>
        </>
        )}
        </>
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
          <section className="calc-panel" aria-label="Calculator">
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
      </div>

      <div className="test-nav">
        <div className="test-nav-inner">
          {!activeBreak && !onIntro && (
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
          )}
          {hasStrategy && elimBtn}
          <button
            className="nav-btn"
            type="button"
            disabled={onIntro ? slideIdx === 0 : !activeBreak && qIndex === 0 && !needIntro}
                onClick={() => {
                  if (onIntro && slideIdx > 0) {
                    setSlideIdx(slideIdx - 1);
                    window.scrollTo(0, 0);
                  } else {
                    stepBack();
                  }
                }}
              >
                BACK
              </button>
          <span className="nav-count">
            {onIntro ? "Theory" : activeBreak ? "Theory" : `${qIndex + 1} of ${total}`}
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
                      : () => stepForward()
                  }
                >
                  NEXT
                </button>
              )}
          {!onIntro && !activeBreak && (
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
          )}
          {!onIntro && !activeBreak && (hasStrategy ? (
            <button
              className={stratOpen ? "strat-nav-btn on" : "strat-nav-btn"}
              type="button"
              onClick={toggleStrategy}
              title={stratOpen ? "Close strategy (S)" : "Open strategy (S)"}
              aria-label={stratOpen ? "Close strategy" : "Open strategy"}
              aria-keyshortcuts="s"
              aria-pressed={stratOpen}
            >
              <BulbIcon />
            </button>
          ) : elimBtn)}
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

      <CodinoPanel
        open={aiOpen}
        pinned={aiPinned}
        onTogglePin={() => setAiPinned((v) => !v)}
        context={aiCtx}
        onClose={() => setAiOpen(false)}
      />
      {stratVisible && (
        <StrategyPanel q={activeQ} onClose={() => setStratOpen(false)} />
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
                  onClick={goToTheory}
                >
                  <span className="ov-q-top">
                    <span className="q-tag">THEORY</span>
                    <span className="ov-stem">Start here — read the theory slide</span>
                  </span>
                </button>
              )}
              {ovFilter === "All" &&
                theoryBreaks.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className={brkId === b.id ? "ov-row current" : "ov-row"}
                    onClick={() => goToBreak(b.id)}
                  >
                    <span className="ov-q-top">
                      <span className="q-tag">THEORY</span>
                      <span className="ov-stem">{(b.heading || `After Question ${b.after}`).replace(/\*/g, "")}</span>
                    </span>
                  </button>
                ))}
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
