import { HomeIcon, DumbbellIcon, BookIcon, BankIcon } from "./icons.jsx";

const ITEMS = [
  { label: "MY TESTS", Icon: HomeIcon, route: "home" },
  { label: "PRACTICE", Icon: DumbbellIcon, route: "practice" },
  { label: "TEST INFO", Icon: BookIcon, route: "info" },
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
