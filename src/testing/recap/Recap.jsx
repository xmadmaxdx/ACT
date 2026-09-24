import { useState } from "react";
import "./recap.css";

const UNITS = [
  {
    id: "u1",
    label: "UNIT 1 · BASICS",
    lessons: [
      { n: 1, title: "First Code" },
      {
        n: 2,
        title: "Variables and Data Types",
        kids: [{ title: "Numbers" }, { title: "Strings" }],
      },
      { n: 3, title: "Input and Output" },
    ],
  },
  {
    id: "u2",
    label: "UNIT 2 · CONTROL FLOW",
    lessons: [
      { n: 4, title: "If Statements" },
      {
        n: 5,
        title: "For Loops",
        kids: [{ title: "Range" }, { title: "Break and Continue" }],
      },
      { n: 6, title: "While Loops" },
    ],
  },
];

function PdfIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 1.5h7l3 3V14.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M10 1.5v3.5h3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Recap() {
  const [pdf, setPdf] = useState(null);

  return (
    <div className="rc-screen">
      <div className="rc-topbar" aria-hidden="true">
        <span className="rc-toptitle">RECAP</span>
      </div>

      {UNITS.map((u) => (
        <div key={u.id} className="rc-unit">
          <p className="rc-unit-label">{u.label}</p>
          {u.lessons.map((l, i) => (
            <div
              className="rc-lesson rise"
              key={l.n}
              style={{ animationDelay: `${Math.min(i, 4) * 60}ms` }}
            >
              <div className="rc-lrow">
                <span className="rc-num">{l.n}</span>
                <span className="rc-ltitle">{l.title}</span>
                <button
                  type="button"
                  className="rc-pdf"
                  onClick={() => setPdf({ unit: u.label, lesson: l.title })}
                  aria-label={`Open ${l.title} PDF`}
                >
                  <PdfIcon /> PDF
                </button>
              </div>
              {(l.kids || []).map((k) => (
                <div className="rc-lrow kid" key={k.title}>
                  <span className="rc-kdot" aria-hidden="true" />
                  <span className="rc-ltitle sm">{k.title}</span>
                  <button
                    type="button"
                    className="rc-pdf"
                    onClick={() => setPdf({ unit: u.label, lesson: `${l.title} · ${k.title}` })}
                    aria-label={`Open ${k.title} PDF`}
                  >
                    <PdfIcon /> PDF
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}

      {pdf && (
        <div className="rc-overlay" onClick={() => setPdf(null)}>
          <div
            className="rc-paper"
            role="dialog"
            aria-modal="true"
            aria-label={`${pdf.lesson} PDF`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close rc-close"
              aria-label="Close PDF"
              onClick={() => setPdf(null)}
            >
              ✕
            </button>
            <p className="rc-paper-eyebrow">{pdf.unit}</p>
            <h4 className="rc-paper-title">{pdf.lesson}</h4>
            <div className="rc-paper-lines" aria-hidden="true">
              <span style={{ width: "92%" }} />
              <span style={{ width: "98%" }} />
              <span style={{ width: "84%" }} />
              <span className="hl" style={{ width: "64%" }} />
              <span style={{ width: "95%" }} />
              <span style={{ width: "88%" }} />
              <span className="hl" style={{ width: "52%" }} />
              <span style={{ width: "90%" }} />
            </div>
            <p className="rc-paper-note">Simulated preview — full PDF ships with the course.</p>
          </div>
        </div>
      )}
    </div>
  );
}
