// Shared chrome for the Community screens: headers, in-page filters, empty
// states and the bottom sheet. Kept separate so Feed/Chat pages can import it
// without a cycle through Community.jsx.

import { BackIcon, CloseIcon, SparkIcon } from "./icons.jsx";

export function Head({ title, sub, onBack, right, bare }) {
  return (
    <header className={bare ? "cm-head bare rise" : "cm-head rise"}>
      {onBack ? (
        <button type="button" className="cm-back" onClick={onBack} aria-label="Back">
          <BackIcon />
        </button>
      ) : null}
      <div className="cm-h-b">
        <h1 className="cm-h-title">{title}</h1>
        {sub ? <p className="cm-h-sub">{sub}</p> : null}
      </div>
      {right ? <div className="cm-h-right">{right}</div> : null}
    </header>
  );
}

export function BrandHead({ right }) {
  return (
    <header className="cm-head bare rise">
      <span className="cm-brand">
        <span className="cm-brand-mark">
          <SparkIcon size={19} />
        </span>
        <span className="cm-brand-name">Community</span>
      </span>
      <span className="cm-h-spacer" />
      {right ? <div className="cm-h-right">{right}</div> : null}
    </header>
  );
}

export function Seg({ options, value, onChange, label }) {
  return (
    <div className="cm-seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={value === o.id ? "cm-seg-btn on" : "cm-seg-btn"}
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
        >
          {o.label}
          {typeof o.count === "number" ? <span className="cnt"> {o.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Empty({ icon, title, sub, actionLabel, onAction }) {
  return (
    <div className="cm-empty">
      <span className="cm-empty-ic">{icon}</span>
      <p className="cm-empty-t">{title}</p>
      {sub ? <p className="cm-empty-s">{sub}</p> : null}
      {actionLabel && onAction ? (
        <button type="button" className="cm-btn ghost sm" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function Sheet({ title, onClose, children }) {
  return (
    <div className="cm-scrim" onClick={onClose}>
      <div
        className="cm-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title || "Options"}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="cm-grab" aria-hidden="true" />
        {title ? <p className="cm-sheet-k">{title}</p> : null}
        {children}
        <button type="button" className="cm-sheet-x" onClick={onClose}>
          <CloseIcon /> Close
        </button>
      </div>
    </div>
  );
}
