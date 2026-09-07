import { LogoMark } from "./icons.jsx";

export default function Loader() {
  return (
    <div className="loader" role="status" aria-label="Loading practice content">
      <div className="loader-logo">
        <LogoMark />
      </div>
      <div className="loader-text">LOADING</div>
    </div>
  );
}
