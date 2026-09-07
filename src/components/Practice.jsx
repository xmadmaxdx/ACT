import { useState } from "react";
import ModeModal from "./ModeModal.jsx";

/* Small card icons — same flat Duo sticker style as the nav icons. */
function PencilIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <rect x="5" y="5" width="17" height="17" rx="4" fill="#fff" stroke="#1cb0f6" strokeWidth="2.5" />
      <path d="M9.5 12.5l6-1 1 6z" fill="#1cb0f6" />
      <path d="M11 15.5l-1.5 4 4-1.5z" fill="#84d8ff" />
      <rect x="19" y="19" width="11" height="11" rx="3.5" fill="#fff" stroke="#afafaf" strokeWidth="2.5" />
      <path d="M22.5 24.5l4.5-4.5M22 27.5l4.5-4.5" stroke="#1cb0f6" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function CalculatorIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <rect x="8" y="3" width="18" height="28" rx="4" fill="#1cb0f6" />
      <rect x="11.5" y="7" width="11" height="6" rx="1.5" fill="#fff" />
      <g fill="#ddf4ff">
        <circle cx="13.5" cy="18" r="2" />
        <circle cx="19" cy="18" r="2" />
        <circle cx="24" cy="18" r="2" />
        <circle cx="13.5" cy="23.5" r="2" />
        <circle cx="19" cy="23.5" r="2" />
        <circle cx="24" cy="23.5" r="2" />
      </g>
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <path d="M17 4l12 6-12 6L5 10z" fill="#1cb0f6" />
      <path d="M7 16.5l10 5 10-5" fill="none" stroke="#84d8ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 22.5l10 5 10-5" fill="none" stroke="#58cc02" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OpenBookIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <path d="M17 8c-3-2.4-7-3-12-2.4V26c5-.6 9 0 12 2.4 3-2.4 7-3 12-2.4V5.6C24 5 20 5.6 17 8z" fill="#ddf4ff" stroke="#1cb0f6" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M17 8v20.4" stroke="#1cb0f6" strokeWidth="2.4" />
      <path d="M9 11.5c2.4-.2 4.4.1 6 1M9 15.5c2.4-.2 4.4.1 6 1M19 12.5c1.6-.9 3.6-1.2 6-1M19 16.5c1.6-.9 3.6-1.2 6-1" stroke="#58cc02" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/* Laptop + clock hero art in the screenshot's flat style, gently animated. */
function PracticeArt() {
  return (
    <div className="duo-wrap" role="img" aria-label="Laptop showing a practice test timer">
      <svg width="280" height="190" viewBox="0 0 280 190" aria-hidden="true">
        <path d="M150 18c22-14 52-12 66 4 20-8 44 2 44 24 0 10-6 18-13 22 8 16 2 40-16 48-16 22-46 30-70 20-22 12-52 6-62-14-20-4-32-24-24-42 3-8 9-13 16-16-4-18 8-38 28-42 10-6 21-7 31-4z" fill="#b8ec6f" opacity="0.55" />
        <g className="art-clock">
          <circle cx="72" cy="66" r="26" fill="#fff" stroke="#d9d9d9" strokeWidth="5" />
          <path d="M72 66V50M72 66l12 6" stroke="#ff9600" strokeWidth="5" strokeLinecap="round" />
        </g>
        <rect x="96" y="52" width="120" height="86" rx="8" fill="#9ec5d8" />
        <rect x="104" y="60" width="104" height="70" rx="4" fill="#4fc3f7" />
        <rect x="128" y="76" width="56" height="40" rx="4" fill="#fff" />
        <path className="art-needle" d="M156 104c2-12 10-20 22-22" fill="none" stroke="#ffc800" strokeWidth="6" strokeLinecap="round" />
        <circle cx="156" cy="104" r="5" fill="#777" />
        <rect x="136" y="86" width="20" height="6" rx="3" fill="#e5e5e5" />
        <rect x="168" y="122" width="14" height="5" rx="2.5" fill="#1cb0f6" />
        <rect x="74" y="138" width="164" height="12" rx="6" fill="#b9c4c9" />
        <rect x="60" y="150" width="192" height="12" rx="6" fill="#ffd900" />
        <rect x="196" y="150" width="56" height="12" rx="6" fill="#ffbb00" />
      </svg>
    </div>
  );
}

const TABS = ["ENGLISH", "MATH", "READING", "COMPLETE"];

const SECTIONS = [
  { tab: "ENGLISH", title: "English Only", meta: "50 questions · 35 min", Icon: PencilIcon },
  { tab: "MATH", title: "Math Only", meta: "60 questions · 60 min", Icon: CalculatorIcon },
  { tab: "READING", title: "Reading Only", meta: "40 questions · 35 min", Icon: OpenBookIcon },
  { tab: "COMPLETE", title: "Complete Test", meta: "150 questions · 2 hrs 10 min", Icon: LayersIcon },
];

const SKILLS = SECTIONS.flatMap((s) =>
  [1, 2, 3, 4].map((n) => ({ ...s, id: `${s.tab}-${n}`, num: n }))
);

export default function Practice({ onStartTest, passageTests }) {
  const [tab, setTab] = useState("ENGLISH");
  const [selected, setSelected] = useState(null);

  const visible = SKILLS.filter((s) => s.tab === tab);
  const visiblePassages = (passageTests || []).filter(
    (t) => (t.section || "").toLowerCase() === tab.toLowerCase()
  );

  return (
    <div>
      <h2 className="section-title rise d3">Practice skills</h2>
      <div className="tabs rise d3" role="tablist" aria-label="Practice sections">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            type="button"
            className={tab === t ? "tab active" : "tab"}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <h3 className="group-title rise d4">Practice tests</h3>
      <div className="skill-grid rise d4">
        {visible.map(({ id, num, title, meta, Icon }) => (
          <button
            key={id}
            type="button"
            className="skill-card"
            onClick={() => setSelected({ id, title: `${title} · Test ${num}`, meta })}
          >
            <span className="skill-ghost" aria-hidden="true">
              {num}
            </span>
            <span className="skill-icon">
              <Icon />
            </span>
            <span className="skill-text">
              <span className="skill-title">{title}</span>
              <span className="skill-meta">{meta}</span>
              <span className="skill-progress">
                <span className="progress-track">
                  <span className="progress-fill" style={{ width: "0%" }} />
                </span>
                <span className="progress-count">0/1</span>
              </span>
            </span>
          </button>
        ))}
      </div>

      {visiblePassages.length > 0 && (
        <>
          <h3 className="group-title">Passages</h3>
          <div className="skill-grid">
            {visiblePassages.map((t) => (
              <button
                key={t.id}
                type="button"
                className="skill-card"
                onClick={() =>
                  setSelected({
                    id: t.id,
                    title: t.title,
                    meta: `${t.total} questions · ${t.timeMinutes} min`,
                  })
                }
              >
                <span className="skill-icon">
                  <OpenBookIcon />
                </span>
                <span className="skill-text">
                  <span className="skill-title">{t.title}</span>
                  <span className="skill-meta">
                    {t.total} questions · {t.timeMinutes} min
                  </span>
                  <span className="skill-progress">
                    <span className="progress-track">
                      <span className="progress-fill" style={{ width: "0%" }} />
                    </span>
                    <span className="progress-count">0/1</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {selected && (
        <ModeModal skill={selected} onClose={() => setSelected(null)} onStart={(mode) => onStartTest(selected, mode)} />
      )}
    </div>
  );
}
