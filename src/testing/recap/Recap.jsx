import { useState } from "react";
import "./recap.css";

const SECTIONS = [
  {
    id: "py",
    title: "Python KICKSTART",
    tag: "12 lessons",
    lessons: [
      { n: 1, title: "First Code", pdf: true },
      {
        n: 2,
        title: "Variables and Data Types",
        pdf: true,
        kids: [
          { title: "Numbers", pdf: true },
          { title: "Strings", pdf: true },
        ],
      },
      { n: 3, title: "Input and Output", pdf: true },
      { n: 4, title: "If Statements", pdf: true },
    ],
  },
  {
    id: "js",
    title: "JavaScript KICKSTART",
    tag: "10 lessons",
    lessons: [
      { n: 1, title: "First Script", pdf: true },
      {
        n: 2,
        title: "Let, Const and Types",
        pdf: true,
        kids: [
          { title: "Numbers", pdf: true },
          { title: "Strings", pdf: true },
        ],
      },
      { n: 3, title: "Functions", pdf: true },
    ],
  },
  {
    id: "math",
    title: "ACT Math RECAP",
    tag: "8 lessons",
    lessons: [
      { n: 1, title: "Slopes in 30 Seconds", pdf: true },
      {
        n: 2,
        title: "Quadratics",
        pdf: true,
        kids: [
          { title: "Factoring", pdf: true },
          { title: "Discriminant", pdf: true },
        ],
      },
      { n: 3, title: "SOHCAHTOA", pdf: true },
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
  const [openId, setOpenId] = useState("py");
  const [pdf, setPdf] = useState(null);

  return (
    <div className="rc-screen">
      <p className="rc-eyebrow">REVISION · ZERO FLUFF</p>
      <h3 className="rc-title">Recap</h3>

      {SECTIONS.map((s) => {
        const open = openId === s.id;
        return (
          <div className={open ? "rc-sec open" : "rc-sec"} key={s.id}>
            <button
              type="button"
              className="rc-sec-head"
              onClick={() => setOpenId(open ? null : s.id)}
              aria-expanded={open}
            >
              <span className="rc-sec-dot" aria-hidden="true" />
              <span className="rc-sec-title">{s.title}</span>
              <span className="rc-sec-tag">{s.tag}</span>
              <svg
                className="rc-chev"
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
            </button>
            {open && (
              <div className="rc-lessons">
                {s.lessons.map((l, i) => (
                  <div
                    className="rc-lesson rise"
                    key={l.n}
                    style={{ animationDelay: `${Math.min(i, 4) * 60}ms` }}
                  >
                    <div className="rc-lrow">
                      <span className="rc-num">{l.n}</span>
                      <span className="rc-ltitle">{l.title}</span>
                      {l.pdf ? (
                        <button
                          type="button"
                          className="rc-pdf"
                          onClick={() => setPdf({ sec: s.title, lesson: l.title })}
                          aria-label={`Open ${l.title} PDF`}
                        >
                          <PdfIcon /> PDF
                        </button>
                      ) : null}
                    </div>
                    {(l.kids || []).map((k) => (
                      <div className="rc-lrow kid" key={k.title}>
                        <span className="rc-kdot" aria-hidden="true" />
                        <span className="rc-ltitle sm">{k.title}</span>
                        {k.pdf ? (
                          <button
                            type="button"
                            className="rc-pdf"
                            onClick={() => setPdf({ sec: s.title, lesson: `${l.title} · ${k.title}` })}
                            aria-label={`Open ${k.title} PDF`}
                          >
                            <PdfIcon /> PDF
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

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
            <p className="rc-paper-eyebrow">{pdf.sec}</p>
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
