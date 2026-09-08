import { useEffect, useRef, useState } from "react";
import { mathRich } from "./MathText.jsx";

const LETTERS = ["A", "B", "C", "D"];
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

export default function TestScreen({ test, session, startIndex, review, findTest, customTestData, onFinish, onExit }) {
  const timed = test.mode === "timed" && !review;
  const testData =
    customTestData && customTestData.id === test.id ? customTestData : findTest(test.id);
  const questions = testData ? testData.questions : [];
  const total = questions.length;
  const [qIndex, setQIndex] = useState(startIndex || 0);
  const [picks, setPicks] = useState((session && session.picks) || {});
  const [flags, setFlags] = useState((session && session.flags) || {});
  const [paces, setPaces] = useState((session && session.paces) || {});
  const [elapsed, setElapsed] = useState(0);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [ovFilter, setOvFilter] = useState("All");
  const [paused, setPaused] = useState(false);

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
  const pacesRef = useRef((session && session.paces) || {});

  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current) return;
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, []);

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
  const picked = picks[activeQ.n] || null;
  const flagged = !!flags[activeQ.n];
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
    setPicks((p) => ({ ...p, [n]: letter }));
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

      <div className="test-body">
        <article className="passage">
          <h1 className="passage-title">{passage.title}</h1>
          <div className="passage-text">
            {passage.paras.map((spans, i) => (
              <p key={`${passage.id}-${i}`}>{renderSpans(spans, activeQ, testData.figures)}</p>
            ))}
          </div>
        </article>

        <aside className="question-panel">
          <section className="q-card" aria-label={`Question ${activeQ.n}`}>
            <div className="q-head">
              <span className="q-badge">{activeQ.n}</span>
              <span className="q-tag">{activeQ.tag}</span>
            </div>
            {activeQ.stem ? <p className="q-stem">{mathRich(activeQ.stem)}</p> : null}
            {paused && (
              <p className="paused-note">Paused — answer choices are locked. Tap play to resume.</p>
            )}
            <div className={paused ? "q-options locked" : "q-options"}>
              {activeQ.options.map((opt, i) => {
                const letter = LETTERS[i];
                const cls = ["q-option"];
                if (picked === letter) cls.push("selected");
                if (showAnswers && letter === activeQ.answer) cls.push("correct");
                if (showAnswers && picked === letter && letter !== activeQ.answer) cls.push("wrong");
                return (
                  <button
                    key={letter}
                    type="button"
                    className={cls.join(" ")}
                    onClick={() => pick(letter)}
                  >
                    <span className="q-letter">{letter}</span>
                    <span className="q-text">{optText(opt)}</span>
                  </button>
                );
              })}
            </div>
            {showAnswers && (
              <div className={picked === activeQ.answer ? "explain ok" : "explain no"}>
                <span className="explain-head">
                  {picked === activeQ.answer ? "Correct" : `Correct answer: ${activeQ.answer}`}
                </span>
                <p className="explain-text">{mathRich(activeQ.explain)}</p>
              </div>
            )}
            <button
              type="button"
              className={flagged ? "flag-btn on" : "flag-btn"}
              onClick={toggleFlag}
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
          </section>

          <div className="test-nav">
            <div className="test-nav-inner">
              <button
                className="nav-btn"
                type="button"
                disabled={qIndex === 0}
                onClick={() => setQIndex(qIndex - 1)}
              >
                BACK
              </button>
              <span className="nav-count">
                {qIndex + 1} of {total}
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
              ) : qIndex === total - 1 ? (
                <button
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
                  onClick={() => setQIndex(qIndex + 1)}
                >
                  NEXT
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>

      {overviewOpen && (
        <div className="overview-overlay" onClick={() => setOverviewOpen(false)}>
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
