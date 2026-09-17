// Detail-finding screen — select-the-answer-span questions, no options.
// Passage left (raw text so selection offsets stay exact), question +
// answer rectangle right. CHECK flashes right/wrong only; EXPLAIN opens
// Codino with passage + stem + expected span + student pick.

import { useCallback, useEffect, useRef, useState } from "react";
import MathText from "./MathText.jsx";
import CodinoPanel from "../ai/CodinoPanel.jsx";
import { scoreSelection } from "../detailScore.js";

function dropSelection() {
  try {
    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();
  } catch {
    /* selection API unavailable — pill hides anyway */
  }
}

// Boundary-sweep paint for one paragraph: hint refs (detail-ref), the
// student's pick (detail-pick), overlap blend (detail-both). Raw text only —
// no math rendering here, so rendered characters always match para offsets.
function renderDetailPara(text, refs, pick, onClearPick) {
  const full = String(text);
  const refSegs = [];
  (refs || []).forEach((r) => {
    if (!r) return;
    if (r.text == null) {
      refSegs.push([0, full.length]);
      return;
    }
    const q = String(r.text);
    if (!q) return;
    let from = 0;
    for (;;) {
      const at = full.indexOf(q, from);
      if (at < 0) break;
      refSegs.push([at, at + q.length]);
      from = at + q.length;
    }
  });
  const pickSegs = pick && pick.e > pick.s ? [[Math.max(0, pick.s), Math.min(full.length, pick.e)]] : [];
  if (refSegs.length === 0 && pickSegs.length === 0) return full;
  const bounds = new Set([0, full.length]);
  refSegs.forEach(([s, e]) => {
    bounds.add(Math.max(0, s));
    bounds.add(Math.min(full.length, e));
  });
  pickSegs.forEach(([s, e]) => {
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
    const inRef = covers(refSegs, a, b);
    const inPick = covers(pickSegs, a, b);
    const slice = full.slice(a, b);
    if (inRef && inPick) {
      out.push(
        <span key={k} className="detail-both">
          {slice}
        </span>
      );
    } else if (inPick) {
      out.push(
        <span
          key={k}
          className="detail-pick"
          title="Your pick — click to clear"
          onClick={onClearPick}
        >
          {slice}
        </span>
      );
    } else if (inRef) {
      out.push(
        <span key={k} className="detail-ref">
          {slice}
        </span>
      );
    } else {
      out.push(<span key={k}>{slice}</span>);
    }
  }
  return out;
}

export default function DetailScreen({ testData, mode, onExit }) {
  const questions = (testData && testData.questions) || [];
  const total = questions.length;
  const timed = mode === "timed";
  const budget = Math.max(60, Math.round(Number(testData && testData.timeMinutes) || 8) * 60);

  const [qIndex, setQIndex] = useState(0);
  const [picks, setPicks] = useState({});
  const [verdicts, setVerdicts] = useState({});
  const [attempts, setAttempts] = useState({});
  const [flash, setFlash] = useState(null);
  const [phase, setPhase] = useState("take");
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [choosePop, setChoosePop] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPinned, setAiPinned] = useState(false);
  const [aiCtx, setAiCtx] = useState(null);

  const passageWrapRef = useRef(null);
  const pendingPick = useRef(null);
  const flashT = useRef(null);
  const autoDoneRef = useRef(false);
  const elapsedRef = useRef(0);
  const pausedRef = useRef(false);

  const cur = questions[Math.min(qIndex, Math.max(total - 1, 0))] || null;
  const passage = cur ? (testData.passages || []).find((p) => p.id === cur.p) || null : null;
  const pick = cur ? picks[cur.n] || null : null;
  const verdict = cur ? verdicts[cur.n] || null : null;
  const tried = cur ? attempts[cur.n] || 0 : 0;

  // Main countdown (timed only). Auto-finishes once at zero.
  useEffect(() => {
    if (!timed) return undefined;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      if (elapsedRef.current >= budget && !autoDoneRef.current) {
        autoDoneRef.current = true;
        setPhase("done");
      }
    }, 1000);
    return () => clearInterval(id);
  }, [timed, budget]);

  useEffect(
    () => () => {
      if (flashT.current) clearTimeout(flashT.current);
    },
    []
  );

  // While Codino is open, follow the active question.
  useEffect(() => {
    if (!aiOpen || !cur) return;
    setAiCtx((prev) => {
      if (!prev || !prev.q || prev.q.n === cur.n) return prev;
      return { ...prev, q: { ...cur, options: [] }, autoAsk: undefined };
    });
  }, [aiOpen, qIndex]);

  // Same-para text selection → floating Choose pill (TestScreen pattern).
  useEffect(() => {
    const hide = () => {
      setChoosePop(null);
      pendingPick.current = null;
    };
    const onSel = () => {
      const wrap = passageWrapRef.current;
      let sel = null;
      let range = null;
      try {
        sel = document.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
          hide();
          return;
        }
        range = sel.getRangeAt(0);
      } catch {
        hide();
        return;
      }
      if (!wrap || !wrap.contains(range.commonAncestorContainer)) {
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
      pendingPick.current = { para: Number(startP.dataset.para) };
      const vw = window.innerWidth || 400;
      setChoosePop({
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

  // Keyboard: arrows move, ignored inside inputs.
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || "";
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setQIndex((i) => Math.min(i + 1, Math.max(total - 1, 0)));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setQIndex((i) => Math.max(i - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  const choosePick = useCallback(() => {
    const pend = pendingPick.current;
    const wrap = passageWrapRef.current;
    setChoosePop(null);
    pendingPick.current = null;
    if (!pend || !wrap || !cur || !passage) {
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
    // Char offsets of the selection start inside the rendered paragraph.
    // Rendering splits text into plain spans only, so lengths match exactly.
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
    const n = cur.n;
    setPicks((m) => ({ ...m, [n]: { para: pend.para, s, e, text: paraText.slice(s, e) } }));
    setVerdicts((m) => {
      if (!m[n]) return m;
      const next = { ...m };
      delete next[n];
      return next;
    });
    dropSelection();
    window.console.debug("detail pick", { n, para: pend.para, s, e });
  }, [cur, passage]);

  const clearPick = useCallback(() => {
    if (!cur) return;
    const n = cur.n;
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
  }, [cur]);

  const check = useCallback(() => {
    if (!cur || !passage || !pick) return;
    const r = scoreSelection(passage.paras, cur.answers || [], pick);
    const n = cur.n;
    setAttempts((m) => ({ ...m, [n]: (m[n] || 0) + 1 }));
    setVerdicts((m) => ({ ...m, [n]: { ok: r.correct } }));
    if (flashT.current) clearTimeout(flashT.current);
    setFlash({ ok: r.correct, key: `${n}-${Date.now()}` });
    flashT.current = setTimeout(() => {
      setFlash(null);
      flashT.current = null;
    }, 1400);
    window.console.debug("detail check", { n, correct: r.correct, recall: r.recall, precision: r.precision });
  }, [cur, passage, pick]);

  const openExplain = useCallback(() => {
    if (!cur || !passage) return;
    const p = picks[cur.n] || null;
    const exp = (cur.answers || [])
      .map((a) => `"${a.text}" (paragraph ${(a.para || 0) + 1})`)
      .join("; ");
    setAiCtx({
      testData,
      q: { ...cur, options: [] },
      pickedLetter: null,
      letters: [],
      reveal: true,
      autoAsk:
        `Explain finding question ${cur.n} (${cur.tag}) step by step. ` +
        `Stem: ${cur.stem} ` +
        `Expected answer span: ${exp}. ` +
        `Student selected: "${p ? p.text : "(nothing)"}". ` +
        `Official note: ${cur.explain || "none"}. ` +
        `Show why the expected span answers the stem and why the student's selection misses.`,
    });
    setAiPinned(false);
    setAiOpen(true);
  }, [cur, passage, picks, testData]);

  const openAsk = useCallback(() => {
    if (!cur) return;
    setAiCtx({
      testData,
      q: { ...cur, options: [] },
      pickedLetter: null,
      letters: [],
      reveal: false,
    });
    setAiPinned(true);
    setAiOpen(true);
  }, [cur, testData]);

  const goTo = useCallback(
    (n) => {
      const idx = questions.findIndex((q) => q.n === n);
      if (idx >= 0) {
        setQIndex(idx);
        window.scrollTo(0, 0);
      }
    },
    [questions]
  );

  const resetAll = useCallback(() => {
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
  }, []);

  if (!testData || total === 0) {
    return (
      <div className="test">
        <div className="missing">
          <h2>Coming soon</h2>
          <p>Questions for this set are still being added.</p>
          <button type="button" className="btn-primary" onClick={onExit}>
            BACK
          </button>
        </div>
      </div>
    );
  }

  const remaining = timed ? Math.max(0, budget - elapsed) : null;
  const mm = remaining === null ? null : Math.floor(remaining / 60);
  const ss = remaining === null ? null : String(remaining % 60).padStart(2, "0");
  const solved = questions.filter((q) => verdicts[q.n] && verdicts[q.n].ok).length;

  if (phase === "done") {
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
                  <button type="button" className="go-btn" onClick={() => {
                    setPhase("take");
                    goTo(q.n);
                  }}>
                    GO
                  </button>
                </div>
              );
            })}
          </div>
          <div className="detail-done-actions">
            <button type="button" className="btn-primary" onClick={resetAll}>
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

  const refHints = (cur.refs || []).filter((r) => r && Number.isInteger(r.para));

  return (
    <div className="test">
      <div className="test-topbar">
        <button type="button" className="icon-button" onClick={onExit} aria-label="Exit finding set">
          ✕
        </button>
        <div className="test-title-block">
          <h1 className="test-title">{testData.title}</h1>
          <p className="test-sub">
            Finding set · Q{cur.n}/{total} · {solved} found
          </p>
        </div>
        <div className="test-right">
          {timed && (
            <>
              <button
                type="button"
                className="pause-btn"
                onClick={() => {
                  setPaused((p) => {
                    pausedRef.current = !p;
                    return !p;
                  });
                }}
                aria-label={paused ? "Resume timer" : "Pause timer"}
              >
                {paused ? "▶" : "⏸"}
              </button>
              <span className={remaining <= 60 ? "test-timer danger" : "test-timer"}>
                {mm}:{ss}
              </span>
            </>
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
              <path d="M10.2 5.2l-2.4 3.1h1.7l-.6 2.5 2.4-3.1H9.6z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      <div className="test-progress-track" aria-hidden="true">
        <div className="test-progress-fill" style={{ width: `${Math.round(((qIndex + 1) / total) * 100)}%` }} />
      </div>
      <div className="detail-dots" role="tablist" aria-label="Questions">
        {questions.map((q, i) => {
          const v = verdicts[q.n];
          const cls =
            "detail-dot" +
            (i === qIndex ? " current" : "") +
            (v ? (v.ok ? " right" : " wrong") : picks[q.n] ? " picked" : "");
          return (
            <button key={q.n} type="button" role="tab" aria-selected={i === qIndex} className={cls} onClick={() => goTo(q.n)} aria-label={`Question ${q.n}`}>
              {q.n}
            </button>
          );
        })}
      </div>

      <div className="detail-grid">
        <article className="passage rise" aria-label={`Passage: ${passage ? passage.title : ""}`}>
          <h2 className="passage-title">{passage ? passage.title : ""}</h2>
          <div ref={passageWrapRef}>
            {(passage ? passage.paras : []).map((para, i) => {
              const paraRefs = refHints.filter((r) => r.para === i);
              const paraPick = pick && pick.para === i ? pick : null;
              return (
                <p key={`${passage.id}-${i}`} data-para={i}>
                  {renderDetailPara(para, paraRefs, paraPick, clearPick)}
                </p>
              );
            })}
          </div>
          {pick && (
            <button type="button" className="hl-clear" onClick={clearPick}>
              Clear pick · ¶{pick.para + 1}
            </button>
          )}
        </article>

        <aside className="detail-side rise d1" aria-label={`Question ${cur.n}`}>
          <span className="q-tag">{cur.tag}</span>
          <h2 className="detail-stem">
            <MathText text={cur.stem} />
          </h2>
          <div className={pick ? "detail-answer filled" : "detail-answer"} aria-live="polite">
            {pick ? (
              <>
                <span className="detail-answer-text">{pick.text}</span>
                <span className="detail-answer-meta">¶{pick.para + 1}{tried > 0 ? ` · ${tried} check${tried === 1 ? "" : "s"}` : ""}</span>
              </>
            ) : (
              <span className="detail-answer-empty">Select the answering words in the passage…</span>
            )}
          </div>
          <button type="button" className="btn-primary detail-check" onClick={check} disabled={!pick}>
            CHECK
          </button>
          {verdict && !verdict.ok && (
            <button type="button" className="cod-explain-pill rise" onClick={openExplain}>
              <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true">
                <path
                  d="M9 1.5c-3.6 0-6 2.8-6 6 0 1.9.9 3.5 2.3 4.6L4.8 15l2.9-1.3c.4.1.8.1 1.3.1 3.6 0 6-2.8 6-6s-2.4-6.3-6-6.3z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path d="M10.2 5.2l-2.4 3.1h1.7l-.6 2.5 2.4-3.1H9.6z" fill="currentColor" />
              </svg>
              <span>Explain</span>
            </button>
          )}
          {verdict && verdict.ok && (
            <p className="detail-solved-note rise">✓ Locked in. Keep hunting.</p>
          )}
          <div className="test-nav detail-nav">
            <button type="button" className="nav-btn" onClick={() => setQIndex((i) => Math.max(i - 1, 0))} disabled={qIndex === 0}>
              ← BACK
            </button>
            <span className="nav-count">
              {qIndex + 1} / {total}
            </span>
            {qIndex < total - 1 ? (
              <button type="button" className="nav-btn primary" onClick={() => setQIndex((i) => Math.min(i + 1, total - 1))}>
                NEXT
              </button>
            ) : (
              <button type="button" className="finish-btn" onClick={() => setPhase("done")}>
                FINISH
              </button>
            )}
          </div>
          {flash && (
            <div key={flash.key} className={flash.ok ? "detail-flash ok" : "detail-flash no"} role="status">
              <span className="detail-flash-mark">{flash.ok ? "✓" : "✕"}</span>
              <span>{flash.ok ? "Correct — sharp eyes." : "Not quite — try again."}</span>
            </div>
          )}
        </aside>
      </div>

      {choosePop && (
        <button
          type="button"
          className="hl-pop"
          style={{ left: choosePop.x, top: choosePop.y }}
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
    </div>
  );
}
