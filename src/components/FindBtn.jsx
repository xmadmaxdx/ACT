// Shared finding-screen button — quiet gray at rest, blue halo on hover,
// physical press on click. One look for CHECK / CLEAR / BACK / NEXT.

export default function FindBtn({ children, onClick, disabled, title, ariaLabel, className }) {
  return (
    <button
      type="button"
      className={className ? `find-btn ${className}` : "find-btn"}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
