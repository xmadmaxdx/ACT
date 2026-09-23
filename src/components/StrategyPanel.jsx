import { useEffect, useRef, useState } from "react";
import MathText from "./MathText.jsx";
import Scribble from "./Scribble.jsx";

function Chevron() {
  return (
    <svg
      className="strat-chev"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <path
        d="M4 6l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StratRow({ index, title, body, stepTitle }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={open ? "strat-row open rise" : "strat-row rise"}
      style={{ animationDelay: `${Math.min(index, 4) * 60}ms` }}
    >
      <button
        type="button"
        className="strat-row-head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="strat-row-title">{title}</span>
        <Chevron />
      </button>
      {open && (
        <div className="strat-row-body">
          {stepTitle ? (
            <p className="strat-step-title">
              <span className="strat-step-title-inner">
                <MathText text={stepTitle} />
                <Scribble className="strat-scribble" />
              </span>
            </p>
          ) : null}
          <MathText text={body} />
        </div>
      )}
    </div>
  );
}

export function BulbIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M9 1.8a5.2 5.2 0 0 0-3.1 9.4c.7.6 1.1 1.2 1.3 2h5.6c.2-.8.6-1.4 1.3-2A5.2 5.2 0 0 0 9 1.8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <line
        x1="7"
        y1="15.4"
        x2="11"
        y2="15.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function StrategyPanel({ q, onClose }) {
  const bodyRef = useRef(null);
  const [narrow, setNarrow] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.matchMedia &&
      window.matchMedia("(max-width: 980px)").matches
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(max-width: 980px)");
    const onChange = (e) => setNarrow(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  const steps = Array.isArray(q.steps) ? q.steps : [];
  const rows = steps.map((s, i) => ({
    title: `Step ${i + 1}`,
    stepTitle: s && typeof s === "object" && !Array.isArray(s) ? String(s.title) : null,
    body: s && typeof s === "object" && !Array.isArray(s) ? String(s.body) : String(s),
  }));
  if (typeof q.solution === "string" && q.solution.length > 0) {
    rows.push({ title: `Step ${steps.length + 1} (solution)`, body: q.solution });
  }

  /* Scroll isolation: wheel/touch over the panel never scrolls Desmos,
     the question area, or the page — even when the panel content is short
     and has nothing to scroll. Re-binds per question since the body remounts. */
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      const canScroll = el.scrollHeight > el.clientHeight + 1;
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      if (!canScroll || (e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) {
        e.preventDefault();
      }
    };
    const onTouch = (e) => {
      if (el.scrollHeight <= el.clientHeight + 1) e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchmove", onTouch, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchmove", onTouch);
    };
  }, [q.n]);

  const body = (
    <>
      <div className="strat-head">
        <span className="strat-brand">
          <BulbIcon />
          Strategy
        </span>
        <button
          type="button"
          className="modal-close"
          aria-label="Close strategy"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <div className="strat-body" key={q.n} ref={bodyRef}>
        {typeof q.strategy === "string" && q.strategy.length > 0 ? (
          <StratRow index={0} title="Strategy" body={q.strategy} />
        ) : null}
        {rows.length > 0 ? (
          <p className="strat-kicker">Step-by-step Explanation</p>
        ) : null}
        {rows.map((r, i) => (
          <StratRow
            key={`${q.n}-${i}`}
            index={(q.strategy ? 1 : 0) + i}
            title={r.title}
            stepTitle={r.stepTitle}
            body={r.body}
          />
        ))}
        {!q.strategy && rows.length === 0 ? (
          <p className="strat-empty">No strategy for this question yet.</p>
        ) : null}
      </div>
    </>
  );

  if (narrow) {
    return (
      <div className="strat-overlay" onClick={onClose}>
        <div
          className="strat-modal"
          role="dialog"
          aria-label="Question strategy"
          onClick={(e) => e.stopPropagation()}
        >
          {body}
        </div>
      </div>
    );
  }
  return (
    <aside className="strat-rail" role="dialog" aria-label="Question strategy">
      {body}
    </aside>
  );
}
