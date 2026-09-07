import { ChatIcon } from "./icons.jsx";

function BuddyOwl() {
  return (
    <svg width="86" height="72" viewBox="0 0 86 72" aria-hidden="true">
      <ellipse cx="43" cy="40" rx="30" ry="30" fill="#58cc02" stroke="#46a302" strokeWidth="3" />
      <circle cx="32" cy="34" r="10" fill="#fff" />
      <circle cx="54" cy="34" r="10" fill="#fff" />
      <g className="buddy-eye">
        <circle cx="33" cy="35" r="4.5" fill="#3c3c3c" />
      </g>
      <g className="buddy-eye">
        <circle cx="53" cy="35" r="4.5" fill="#3c3c3c" />
      </g>
      <path d="M39 46h8l-4 6z" fill="#ff9600" />
    </svg>
  );
}

export default function Footer() {
  return (
    <>
      <footer className="footer">
        <button className="footer-link" type="button">
          WEBSITE
        </button>
        <button className="footer-link" type="button">
          PRIVACY
        </button>
        <button className="footer-link" type="button">
          TERMS
        </button>
      </footer>
      <div className="duo-buddy" title="Your ACTprep buddy">
        <BuddyOwl />
      </div>
      <button className="help-pill" type="button">
        <ChatIcon />
        <span>HELP</span>
      </button>
    </>
  );
}
