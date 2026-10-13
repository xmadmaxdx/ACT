// Tiny shared chrome for the Codino Agent screens: switches, segmented
// controls, bottom sheets and empty states. No cycles — views import from here.

import { CloseIcon } from "./icons.jsx";

export function AgSwitch({ on, onToggle, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!on}
      aria-label={label}
      className={on ? "ag-switch on" : "ag-switch"}
      onClick={onToggle}
    >
      <span className="ag-knob" aria-hidden="true" />
    </button>
  );
}

export function AgSeg({ options, value, onChange, label }) {
  return (
    <div className="ag-seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={value === o.id ? "ag-seg-btn on" : "ag-seg-btn"}
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function AgSheet({ title, onClose, children }) {
  return (
    <div className="ag-scrim" onClick={onClose}>
      <div
        className="ag-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title || "Options"}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="ag-grab" aria-hidden="true" />
        {title ? <p className="ag-sheet-k">{title}</p> : null}
        {children}
        <button type="button" className="ag-sheet-x" onClick={onClose}>
          <CloseIcon /> Close
        </button>
      </div>
    </div>
  );
}

export function AgEmpty({ icon, title, sub, actionLabel, onAction }) {
  return (
    <div className="ag-empty">
      <span className="ag-empty-ic">{icon}</span>
      <p className="ag-empty-t">{title}</p>
      {sub ? <p className="ag-empty-s">{sub}</p> : null}
      {actionLabel && onAction ? (
        <button type="button" className="ag-btn ghost sm" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function AgRow({ icon, title, sub, right, onClick }) {
  const cls = onClick ? "ag-row link" : "ag-row";
  return (
    <div
      className={cls}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
    >
      {icon ? <span className="ag-row-ic">{icon}</span> : null}
      <span className="ag-row-b">
        <span className="ag-row-t">{title}</span>
        {sub ? <span className="ag-row-s">{sub}</span> : null}
      </span>
      {right}
    </div>
  );
}
