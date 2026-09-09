import { HomeIcon, DumbbellIcon, BookIcon, BankIcon } from "./icons.jsx";

function ChaptersIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
      <rect x="4" y="4" width="22" height="22" rx="4" fill="#ddf4ff" stroke="#1cb0f6" strokeWidth="2.2" />
      <path d="M10 11h10M10 15h10M10 19h6" stroke="#1cb0f6" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

const ITEMS = [
  { label: "MY TESTS", Icon: HomeIcon, route: "home" },
  { label: "PRACTICE", Icon: DumbbellIcon, route: "practice" },
  { label: "COURSES", Icon: BookIcon, route: "info" },
  { label: "CHAPTERS", Icon: ChaptersIcon, route: "chapters" },
  { label: "INSTITUTIONS", Icon: BankIcon, route: null },
];

export default function Sidebar({ active, onNavigate }) {
  return (
    <nav className="sidebar rise d2" aria-label="Primary">
      {ITEMS.map(({ label, Icon, route }) => (
        <button
          key={label}
          type="button"
          className={active === route ? "nav-item active" : "nav-item"}
          onClick={route ? () => onNavigate(route) : undefined}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
