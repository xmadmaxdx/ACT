import { useState } from "react";

const MODES = [
  {
    id: "timed",
    title: "Timed",
    desc: "Real test conditions with a countdown.",
    Icon: () => (
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
        <circle cx="15" cy="16" r="10" fill="#fff" stroke="#1cb0f6" strokeWidth="2.6" />
        <path d="M15 16v-6M15 16l4.5 2.5" stroke="#ff9600" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M12 3.5h6" stroke="#1cb0f6" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "untimed",
    title: "Untimed",
    desc: "No clock. Learn at your own pace.",
    Icon: () => (
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
        <path d="M8 20c-2.8 0-5-2-5-4.5S5.2 11 8 11c4 0 6 9 14 9 2.8 0 5-2 5-4.5S24.8 11 22 11c-8 0-10 9-14 9z" fill="none" stroke="#1cb0f6" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function ModeModal({ skill, onClose, onStart }) {
  const [mode, setMode] = useState("untimed");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${skill.title} practice mode`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
          ✕
        </button>
        <h3 className="modal-title">{skill.title}</h3>
        <p className="modal-sub">
          {skill.meta} · How do you want to practice?
        </p>
        <div className="mode-list">
          {MODES.map(({ id, title, desc, Icon }) => (
            <button
              key={id}
              type="button"
              className={mode === id ? "mode-option selected" : "mode-option"}
              onClick={() => setMode(id)}
            >
              <span className="mode-radio" aria-hidden="true" />
              <span className="mode-icon">
                <Icon />
              </span>
              <span className="mode-text">
                <span className="mode-title">{title}</span>
                <span className="mode-desc">{desc}</span>
              </span>
            </button>
          ))}
        </div>
        <button className="btn-primary modal-cta" type="button" onClick={() => onStart(mode)}>
          START PRACTICE
        </button>
      </div>
    </div>
  );
}
