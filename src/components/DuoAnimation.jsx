/* Premium animated Duo-style owl holding an ACT score report.
   Pure SVG + CSS keyframes: float, breathe, blink, wing wave,
   badge pop, shadow pulse, sparkle twinkle. Loops forever. */

export default function DuoAnimation() {
  return (
    <div className="duo-wrap" role="img" aria-label="ACTprep owl mascot holding a score report">
      <svg width="300" height="240" viewBox="0 0 300 240" aria-hidden="true">
        <ellipse className="duo-shadow" cx="150" cy="222" rx="96" ry="12" fill="#1cb0f6" />

        {/* sparkles */}
        <g fill="#ffc800">
          <path className="duo-spark" d="M42 52l3.2 7.4 7.4 3.2-7.4 3.2L42 73.2l-3.2-7.4-7.4-3.2 7.4-3.2z" />
          <path className="duo-spark two" d="M262 40l2.6 6 6 2.6-6 2.6-2.6 6-2.6-6-6-2.6 6-2.6z" />
          <path className="duo-spark three" d="M272 150l2.2 5 5 2.2-5 2.2-2.2 5-2.2-5-5-2.2 5-2.2z" />
        </g>

        {/* score report card */}
        <g>
          <rect x="52" y="70" width="104" height="128" rx="10" fill="#fff" stroke="#e5e5e5" strokeWidth="3" />
          <rect x="52" y="70" width="104" height="30" rx="10" fill="#1cb0f6" />
          <rect x="66" y="79" width="56" height="10" rx="5" fill="#fff" opacity="0.9" />
          <rect x="66" y="112" width="76" height="8" rx="4" fill="#e5e5e5" />
          <rect x="66" y="126" width="76" height="8" rx="4" fill="#e5e5e5" />
          <rect x="66" y="140" width="52" height="8" rx="4" fill="#e5e5e5" />
          <rect x="66" y="158" width="76" height="22" rx="6" fill="#ddf4ff" />
          <text x="104" y="174" textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="900" fontSize="15" fill="#1cb0f6">
            36
          </text>
          {/* seal badge */}
          <g className="duo-badge">
            <circle cx="150" cy="96" r="17" fill="#58cc02" stroke="#46a302" strokeWidth="3" />
            <path d="M142.5 96.5l5 5 10-11" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M143 110l-3 12 7-4 3 7 6-8 8 2-2-9z" fill="#ffc800" />
          </g>
        </g>

        {/* owl body */}
        <g className="duo-body">
          <ellipse cx="208" cy="150" rx="58" ry="66" fill="#58cc02" />
          <ellipse cx="208" cy="150" rx="58" ry="66" fill="none" stroke="#46a302" strokeWidth="4" />
          <ellipse cx="208" cy="172" rx="34" ry="38" fill="#89e219" />
          {/* wing (waves) */}
          <g className="duo-wing">
            <ellipse cx="160" cy="150" rx="16" ry="34" fill="#46a302" transform="rotate(18 160 150)" />
          </g>
          <ellipse cx="256" cy="150" rx="14" ry="30" fill="#46a302" transform="rotate(-18 256 150)" />
          {/* eyes */}
          <g>
            <circle cx="188" cy="118" r="21" fill="#fff" />
            <circle cx="230" cy="118" r="21" fill="#fff" />
            <g className="duo-eye">
              <circle cx="190" cy="120" r="9" fill="#3c3c3c" />
              <circle cx="193" cy="117" r="3" fill="#fff" />
            </g>
            <g className="duo-eye right">
              <circle cx="228" cy="120" r="9" fill="#3c3c3c" />
              <circle cx="231" cy="117" r="3" fill="#fff" />
            </g>
          </g>
          {/* beak */}
          <path d="M202 140h14l-7 10z" fill="#ff9600" stroke="#e08a00" strokeWidth="2" strokeLinejoin="round" />
          {/* feet */}
          <path d="M188 214v8M188 222l-6 5M188 222l6 5" stroke="#ff9600" strokeWidth="4" strokeLinecap="round" />
          <path d="M228 214v8M228 222l-6 5M228 222l6 5" stroke="#ff9600" strokeWidth="4" strokeLinecap="round" />
          {/* head tuft */}
          <path d="M196 86c4-8 10-8 12-2 2-6 8-6 12 2" fill="none" stroke="#46a302" strokeWidth="5" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
