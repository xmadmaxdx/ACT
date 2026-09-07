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

export function LoaderError({ message }) {
  return (
    <div className="loader" role="alert">
      <div className="loader-logo">
        <LogoMark />
      </div>
      <div className="loader-text">LOADING</div>
      <div className="loader-error-box">
        <p className="loader-error-title">Couldn't reach the test database.</p>
        <p className="loader-error-msg">{message}</p>
        <button className="btn-primary" type="button" onClick={() => window.location.reload()}>
          RETRY
        </button>
      </div>
    </div>
  );
}
