// Hand-drawn marker underline. Width is 100% of its parent — wrap it in a
// shrink-wrapped parent to hug text. Draw-in animation is opt-in via the
// consumer's class (see .strat-scribble path).
export default function Scribble({ className }) {
  return (
    <svg
      className={className || "scribble"}
      viewBox="0 0 120 9"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M2 5.5 C 25 2.5, 45 7.5, 70 4.5 S 105 3.5, 118 5.5"
        pathLength={1}
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  );
}
