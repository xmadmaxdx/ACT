// Stroke icon set for the Codino Agent demo. currentColor-driven, decorative:
// every usage sits next to visible text, so all render aria-hidden.

function base(w, h, sw = 2.2) {
  return {
    width: w,
    height: h,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: sw,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
}

export function MenuIcon() {
  return (
    <svg {...base(20, 20, 2.6)}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

export function PencilIcon() {
  return (
    <svg {...base(19, 19)}>
      <path d="M14.5 6.5a4 4 0 0 0-5.6 5L4 16.4V20h3.6l4.9-4.9a4 4 0 0 0 5-5.6l-2.7 2.7-2.4-2.4z" />
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

export function SparkIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.3 6.7L21 11l-6.7 2.3L12 20l-2.3-6.7L3 11l6.7-2.3z" />
    </svg>
  );
}

export function ChevronDownIcon() {
  return (
    <svg {...base(14, 14)}>
      <path d="M4 9l4 4 4-4" />
    </svg>
  );
}

export function ChevronLeftIcon() {
  return (
    <svg {...base(16, 16, 2.4)}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function BackIcon() {
  return (
    <svg {...base(20, 20, 2.6)}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function ChevronRightIcon() {
  return (
    <svg {...base(16, 16, 2.4)}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function ChevronUpIcon() {
  return (
    <svg {...base(14, 14)}>
      <path d="M4 15l4-4 4 4" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg {...base(17, 17, 2.4)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg {...base(17, 17, 2.6)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg {...base(15, 15, 2.6)}>
      <path d="M4.5 12.5l5 5L19.5 7" />
    </svg>
  );
}

export function PinIcon() {
  return (
    <svg {...base(16, 16)}>
      <path d="M9 4h6l-1 7 2.5 3.5H7.5L10 11z" />
      <path d="M12 14.5V21" />
    </svg>
  );
}

export function ArchiveIcon() {
  return (
    <svg {...base(16, 16)}>
      <rect x="3" y="4.5" width="18" height="4.5" rx="1.5" />
      <path d="M5 9v9.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V9" />
      <path d="M10 12.5h4" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg {...base(16, 16)}>
      <path d="M4.5 7h15M9.5 7V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3V7" />
      <path d="M6.5 7l.9 12.2A1.5 1.5 0 0 0 8.9 20.5h6.2a1.5 1.5 0 0 0 1.5-1.3L17.5 7" />
    </svg>
  );
}

export function GearIcon() {
  return (
    <svg {...base(20, 20)}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19 12a7 7 0 0 0-.15-1.4l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2.4-1.4L13.7 2h-3.4l-.45 2.6a7 7 0 0 0-2.4 1.4l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2.8l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2.4 1.4l.45 2.6h3.4l.45-2.6a7 7 0 0 0 2.4-1.4l2.3 1 2-3.4-2-1.5c.1-.45.15-.92.15-1.4z" />
    </svg>
  );
}

export function PlayIcon() {
  return (
    <svg {...base(15, 15)} fill="currentColor" stroke="none">
      <path d="M7 4.6l9 5.4-9 5.4z" />
    </svg>
  );
}

export function StopIcon() {
  return (
    <svg {...base(14, 14)} fill="currentColor" stroke="none">
      <rect x="5.5" y="5.5" width="13" height="13" rx="2.5" />
    </svg>
  );
}

export function CopyIcon() {
  return (
    <svg {...base(16, 16)}>
      <rect x="9" y="9" width="11.5" height="11.5" rx="2.5" />
      <path d="M5.5 15h-1a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </svg>
  );
}

export function RetryIcon() {
  return (
    <svg {...base(16, 16)}>
      <path d="M3.5 8a9 9 0 0 1 15.9-1.5L21 8" />
      <path d="M21 3.5V8h-4.5" />
      <path d="M20.5 16a9 9 0 0 1-15.9 1.5L3 16" />
      <path d="M3 20.5V16h4.5" />
    </svg>
  );
}

export function EditIcon() {
  return (
    <svg {...base(16, 16)}>
      <path d="M14.5 6.5a4 4 0 0 0-5.6 5L4 16.4V20h3.6l4.9-4.9a4 4 0 0 0 5-5.6l-2.7 2.7-2.4-2.4z" />
    </svg>
  );
}

export function ShareIcon() {
  return (
    <svg {...base(16, 16)}>
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="17.5" cy="5.5" r="2.6" />
      <circle cx="17.5" cy="18.5" r="2.6" />
      <path d="M8.3 10.8l6.9-4M8.3 13.2l6.9 4" />
    </svg>
  );
}

export function FlagIcon() {
  return (
    <svg {...base(16, 16)}>
      <path d="M5 21V4" />
      <path d="M5 4.5h12.5l-2.5 4 2.5 4H5" />
    </svg>
  );
}

export function DownloadIcon() {
  return (
    <svg {...base(16, 16)}>
      <path d="M12 4v11M7 11l5 5 5-5" />
      <path d="M4.5 20.5h15" />
    </svg>
  );
}

export function FileIcon() {
  return (
    <svg {...base(16, 16)}>
      <path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z" />
      <path d="M14 3v4.5h4.5" />
    </svg>
  );
}

export function DiffIcon() {
  return (
    <svg {...base(16, 16)}>
      <circle cx="6.5" cy="6" r="2.2" />
      <circle cx="6.5" cy="18" r="2.2" />
      <circle cx="17.5" cy="12" r="2.2" />
      <path d="M6.5 8.2v7.6M8.3 6.6c3.6.3 3.4 3.5 6.7 4" />
    </svg>
  );
}

export function ShieldIcon() {
  return (
    <svg {...base(18, 18)}>
      <path d="M12 3l7 2.6v5.6c0 4.3-3 7.8-7 9.8-4-2-7-5.5-7-9.8V5.6z" />
      <path d="M9 11.8l2.2 2.2 4-4.2" />
    </svg>
  );
}

export function WrenchIcon() {
  return (
    <svg {...base(16, 16)}>
      <path d="M14.5 6.5a4 4 0 0 1 5.2-3.8l-3 3 1.3 2.6 2.6 1.3 3-3a4 4 0 0 1-5.6 5.1L8 21H4v-4z" />
    </svg>
  );
}

export function MicIcon() {
  return (
    <svg {...base(20, 20)}>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg {...base(20, 20, 2.4)}>
      <path d="M12 6v12M6 12h12" />
    </svg>
  );
}

export function SendIcon() {
  return (
    <svg {...base(19, 19, 2.4)}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

export function PhotoIcon() {
  return (
    <svg {...base(18, 18)}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M4.5 17.5l4.5-4.5 3 3 3.5-3.5 4 4" />
    </svg>
  );
}

export function CameraIcon() {
  return (
    <svg {...base(18, 18)}>
      <path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13.5" r="3.4" />
    </svg>
  );
}

export function BranchIcon() {
  return (
    <svg {...base(15, 15)}>
      <circle cx="6" cy="6" r="2.4" />
      <circle cx="6" cy="18" r="2.4" />
      <circle cx="18" cy="12" r="2.4" />
      <path d="M6 8.4v7.2M8 7c4 0 3 3.4 7.6 3.9" />
    </svg>
  );
}

export function BoltIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.6 2L4.5 13.4h5.6L9.3 22l9.2-11.6h-5.7z" />
    </svg>
  );
}

export function ServerIcon() {
  return (
    <svg {...base(18, 18)}>
      <rect x="3.5" y="4.5" width="17" height="6.5" rx="2" />
      <rect x="3.5" y="13" width="17" height="6.5" rx="2" />
      <circle cx="7.5" cy="7.8" r="0.5" fill="currentColor" />
      <circle cx="7.5" cy="16.3" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function KeyIcon() {
  return (
    <svg {...base(18, 18)}>
      <circle cx="8" cy="14" r="4" />
      <path d="M11 11l8-8M16 4l3 3M13.5 6.5l2.5 2.5" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg {...base(18, 18)}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
      <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
    </svg>
  );
}

export function BellIcon() {
  return (
    <svg {...base(18, 18)}>
      <path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2.5h-15z" />
      <path d="M10 21a2.2 2.2 0 0 0 4 0" />
    </svg>
  );
}
