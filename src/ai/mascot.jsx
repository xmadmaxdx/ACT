// Codino — original ACTprep mascot. A little ink-spark: droplet body, bright eyes,
// amber bolt on its belly. Idle bobs and blinks; thinking tilts with a buzz.

export default function CodinoMascot({ mood, size }) {
  const cls = ["cod-mascot", mood === "thinking" ? "is-thinking" : "is-idle"].join(" ");
  return (
    <svg
      className={cls}
      width={size || 84}
      height={size || 84}
      viewBox="0 0 120 120"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse className="cod-m-shadow" cx="60" cy="108" rx="24" ry="5.5" />
      <g className="cod-m-bob">
        <ellipse cx="47" cy="101" rx="7" ry="4" className="cod-m-foot" />
        <ellipse cx="73" cy="101" rx="7" ry="4" className="cod-m-foot" />
        <path
          className="cod-m-body"
          d="M60 10 C41 32 30 51 30 69 a30 30 0 0 0 60 0 C90 51 79 32 60 10 Z"
        />
        <ellipse cx="60" cy="78" rx="16.5" ry="12.5" className="cod-m-belly" />
        <polygon
          className="cod-m-bolt"
          points="64,57 51,76 59.5,76 55.5,91 70,69.5 61.5,69.5"
        />
        <g className="cod-m-eyes">
          <circle cx="49.5" cy="50" r="7" className="cod-m-eye-white" />
          <circle cx="70.5" cy="50" r="7" className="cod-m-eye-white" />
          <circle cx="49.5" cy="52" r="3.1" className="cod-m-pupil" />
          <circle cx="70.5" cy="52" r="3.1" className="cod-m-pupil" />
          <circle cx="50.5" cy="51" r="1" className="cod-m-glint" />
          <circle cx="71.5" cy="51" r="1" className="cod-m-glint" />
        </g>
      </g>
    </svg>
  );
}
