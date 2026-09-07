import { LogoMark, CartIcon } from "./icons.jsx";

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="brand rise d1">
          <LogoMark />
          <span className="brand-name">actprep</span>
        </div>
        <div className="header-actions rise d2">
          <button className="icon-button" type="button" aria-label="Cart">
            <CartIcon />
          </button>
          {/* Single static user — no login for now */}
          <div className="user-dot" title="Guest learner">
            S
          </div>
        </div>
      </div>
    </header>
  );
}
