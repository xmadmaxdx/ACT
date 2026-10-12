// Hand-drawn SVG icon set for the Community demo. All strokes use currentColor
// so a parent's color drives them. Icons are decorative — every usage sits next
// to visible text, so they render aria-hidden.

function base(w, h) {
  return {
    width: w,
    height: h,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
}

export function BackIcon() {
  return (
    <svg {...base(20, 20)} strokeWidth="2.6">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg {...base(18, 18)} strokeWidth="2.6">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg {...base(18, 18)} strokeWidth="2.4">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg {...base(22, 22)} strokeWidth="2.4">
      <path d="M12 6v12M6 12h12" />
    </svg>
  );
}

export function SendIcon() {
  return (
    <svg {...base(20, 20)} strokeWidth="2.4">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

export function MicIcon() {
  return (
    <svg {...base(21, 21)} strokeWidth="2.2">
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5" />
    </svg>
  );
}

export function PhotoIcon() {
  return (
    <svg {...base(20, 20)} strokeWidth="2.2">
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M4.5 17.5l4.5-4.5 3 3 3.5-3.5 4 4" />
    </svg>
  );
}

export function FileIcon() {
  return (
    <svg {...base(20, 20)} strokeWidth="2.2">
      <path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z" />
      <path d="M14 3v4.5h4.5" />
    </svg>
  );
}

export function PlayIcon() {
  return (
    <svg {...base(16, 16)} fill="currentColor" stroke="none">
      <path d="M7 4.6l9 5.4-9 5.4z" />
    </svg>
  );
}

export function PauseIcon() {
  return (
    <svg {...base(16, 16)} fill="currentColor" stroke="none">
      <rect x="6.5" y="5" width="3.6" height="14" rx="1.4" />
      <rect x="13.9" y="5" width="3.6" height="14" rx="1.4" />
    </svg>
  );
}

export function DotsIcon() {
  return (
    <svg {...base(18, 18)} fill="currentColor" stroke="none">
      <circle cx="5.5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="18.5" cy="12" r="1.8" />
    </svg>
  );
}

export function CopyIcon() {
  return (
    <svg {...base(16, 16)} strokeWidth="2.2">
      <rect x="9" y="9" width="11.5" height="11.5" rx="2.5" />
      <path d="M5.5 15h-1a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </svg>
  );
}

export function ReplyIcon() {
  return (
    <svg {...base(16, 16)} strokeWidth="2.3">
      <path d="M9 6L4 11l5 5" />
      <path d="M4 11h8a7 7 0 0 1 7 7v1" />
    </svg>
  );
}

export function EditIcon() {
  return (
    <svg {...base(16, 16)} strokeWidth="2.2">
      <path d="M14.5 6.5a4 4 0 0 0-5.6 5L4 16.4V20h3.6l4.9-4.9a4 4 0 0 0 5-5.6l-2.7 2.7-2.4-2.4z" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg {...base(16, 16)} strokeWidth="2.2">
      <path d="M4.5 7h15M9.5 7V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3V7" />
      <path d="M6.5 7l.9 12.2A1.5 1.5 0 0 0 8.9 20.5h6.2a1.5 1.5 0 0 0 1.5-1.3L17.5 7" />
    </svg>
  );
}

export function ForwardIcon() {
  return (
    <svg {...base(16, 16)} strokeWidth="2.3">
      <path d="M15 6l5 5-5 5" />
      <path d="M20 11h-8a7 7 0 0 0-7 7v1" />
    </svg>
  );
}

export function FlagIcon() {
  return (
    <svg {...base(16, 16)} strokeWidth="2.2">
      <path d="M5 21V4" />
      <path d="M5 4.5h12.5l-2.5 4 2.5 4H5" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg {...base(15, 15)} strokeWidth="2.6">
      <path d="M4.5 12.5l5 5L19.5 7" />
    </svg>
  );
}

export function DoubleCheckIcon() {
  return (
    <svg {...base(18, 18)} strokeWidth="2.2">
      <path d="M2 12.5l4 4 8-8" />
      <path d="M9.5 16.5l1 1 8-8" />
    </svg>
  );
}

export function ChevronIcon() {
  return (
    <svg {...base(16, 16)} strokeWidth="2.4">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function PeopleIcon() {
  return (
    <svg {...base(20, 20)} strokeWidth="2.2">
      <circle cx="9.5" cy="8.5" r="3.6" />
      <path d="M3.5 19.5a6 6 0 0 1 12 0" />
      <path d="M16 5.4a3.6 3.6 0 0 1 0 6.4M17.5 14.4a6 6 0 0 1 3 4.4" />
    </svg>
  );
}

export function ChatIcon() {
  return (
    <svg {...base(20, 20)} strokeWidth="2.2">
      <path d="M20.5 12.2c0 4-3.8 7.2-8.5 7.2a10 10 0 0 1-2.7-.4L4 20.5l1.4-3.8A6.8 6.8 0 0 1 3.5 12.2C3.5 8.2 7.3 5 12 5s8.5 3.2 8.5 7.2z" />
    </svg>
  );
}

export function GlobeIcon() {
  return (
    <svg {...base(20, 20)} strokeWidth="2.2">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c-4.8 4.9-4.8 12.1 0 17M12 3.5c4.8 4.9 4.8 12.1 0 17" />
    </svg>
  );
}

export function FlameIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.4 2.2c.5 2.9-.7 4.4-2.2 5.9C9.4 9.9 7.3 11.7 7.3 15a6.7 6.7 0 0 0 13.4 0c0-3.6-2-6.3-3.6-8.4-.3 1-.9 1.8-1.8 2.3.5-2.3.1-4.7-1.9-6.7z" />
      <path d="M11.9 13c.3 1.5-.5 2.3-1.3 3.1-.8.8-1.4 1.5-1.4 2.6a3.4 3.4 0 0 0 6.8 0c0-1.8-1-3.1-1.9-4.2-.2.5-.5.9-1 1.1.3-1.1.1-2-.1-2.6z" opacity="0.55" />
    </svg>
  );
}

export function BookIcon({ size = 22 }) {
  return (
    <svg {...base(size, size)} strokeWidth="2.1">
      <path d="M4 5.2A1.7 1.7 0 0 1 5.7 3.5H11a2 2 0 0 1 2 2v14a1.6 1.6 0 0 0-1.6-1.6H5.7A1.7 1.7 0 0 1 4 16.2z" />
      <path d="M20 5.2a1.7 1.7 0 0 0-1.7-1.7H13a2 2 0 0 0-2 2v14a1.6 1.6 0 0 1 1.6-1.6h5A1.7 1.7 0 0 0 20 16.2z" />
    </svg>
  );
}

export function SparkIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.3 6.7L21 11l-6.7 2.3L12 20l-2.3-6.7L3 11l6.7-2.3z" />
      <path d="M19 15l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" opacity="0.7" />
    </svg>
  );
}

export function HeartIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 20.6l-1.4-1.3C5.4 14.7 2.5 12 2.5 8.7 2.5 6 4.6 4 7.2 4c1.6 0 3 .7 3.9 1.9L12 7.3l.9-1.4C13.8 4.7 15.2 4 16.8 4c2.6 0 4.7 2 4.7 4.7 0 3.3-2.9 6-8.1 10.6z" />
    </svg>
  );
}

export function StarIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
    </svg>
  );
}

export function TrophyIcon({ size = 22 }) {
  return (
    <svg {...base(size, size)} strokeWidth="2.1">
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 6H4.5a2.5 2.5 0 0 0 2.5 5M17 6h2.5a2.5 2.5 0 0 1-2.5 5" />
      <path d="M12 14v3.5M8.5 20.5h7l-.7-3h-5.6z" />
    </svg>
  );
}

export function TargetIcon({ size = 22 }) {
  return (
    <svg {...base(size, size)} strokeWidth="2.1">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.6" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function BoltIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.6 2L4.5 13.4h5.6L9.3 22l9.2-11.6h-5.7z" />
    </svg>
  );
}

export function MoonIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.4 14.6A8.6 8.6 0 0 1 9.4 3.6a8.9 8.9 0 1 0 11 11z" />
    </svg>
  );
}

export function ShieldIcon({ size = 22 }) {
  return (
    <svg {...base(size, size)} strokeWidth="2.1">
      <path d="M12 3l7 2.6v5.6c0 4.3-3 7.8-7 9.8-4-2-7-5.5-7-9.8V5.6z" />
    </svg>
  );
}

const GLYPHS = {
  spark: SparkIcon,
  target: TargetIcon,
  flame: FlameIcon,
  moon: MoonIcon,
  trophy: TrophyIcon,
  bolt: BoltIcon,
  heart: HeartIcon,
  book: BookIcon,
  star: StarIcon,
  shield: ShieldIcon,
};

export function BadgeGlyph({ name, size = 24 }) {
  const G = GLYPHS[name] || SparkIcon;
  return <G size={size} />;
}

export function Avatar({ person, size = 44, dot = false }) {
  const p = person || { name: "?", color: "#afafaf", online: false };
  const parts = p.name.trim().split(/\s+/);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0].slice(0, 1);
  return (
    <span
      className="cm-av"
      aria-hidden="true"
      style={{ width: size, height: size, background: p.color, fontSize: Math.round(size * 0.36) }}
    >
      {initials.toUpperCase()}
      {dot && p.online ? <i className="cm-av-dot" /> : null}
    </span>
  );
}
