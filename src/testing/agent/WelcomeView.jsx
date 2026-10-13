// First-run onboarding: hero → connect → done. Full-bleed, three steps,
// inline validation, mock connection test, skip for returning users.

import { useState } from "react";
import { BoltIcon, CheckIcon } from "./icons.jsx";

export function WelcomeView({ onDone }) {
  const [step, setStep] = useState(0);
  const [url, setUrl] = useState("https://");
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const urlOk = /^https:\/\/.+\..+/.test(url.trim());
  const keyOk = key.trim().length >= 8;

  const test = () => {
    if (!urlOk || !keyOk) return;
    setTesting(true);
    setResult(null);
    window.setTimeout(() => {
      setTesting(false);
      setResult(url.includes("fail") ? "fail" : "ok");
    }, 900);
  };

  const pasteKey = () => {
    setKey("ck_pasted_9f27ab41");
  };

  return (
    <div className="ag-wel">
      <span className="ag-blob b1" aria-hidden="true" />
      <span className="ag-blob b2" aria-hidden="true" />
      <div className="ag-wel-body">
        {step === 0 ? (
          <>
            <span className="ag-wel-mark">
              <BoltIcon size={40} />
            </span>
            <p className="ag-wel-t">Codino Agent</p>
            <p className="ag-wel-s">A coding agent in your pocket. It reads, runs and edits code.</p>
          </>
        ) : step === 1 ? (
          <>
            <p className="ag-wel-t">Connect</p>
            <p className="ag-wel-s">Point Codino at your agent server.</p>
            <div className="ag-wel-card">
              <div className="ag-field-row">
                <input
                  className="ag-textin"
                  value={url}
                  maxLength={80}
                  inputMode="url"
                  aria-label="Server URL"
                  placeholder="https://…"
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setResult(null);
                  }}
                />
              </div>
              {!urlOk && url.length > 8 ? <p className="ag-err">Use https:// with a host</p> : null}
              <div className="ag-field-row">
                <input
                  className="ag-textin"
                  type={showKey ? "text" : "password"}
                  value={key}
                  maxLength={80}
                  autoComplete="off"
                  aria-label="API key"
                  placeholder="API key"
                  onChange={(e) => {
                    setKey(e.target.value);
                    setResult(null);
                  }}
                />
                <button type="button" className="ag-mini-btn" onClick={() => setShowKey((v) => !v)} aria-label={showKey ? "Hide key" : "Show key"}>
                  {showKey ? "Hide" : "Show"}
                </button>
                <button type="button" className="ag-mini-btn" onClick={pasteKey} aria-label="Paste key">
                  Paste
                </button>
              </div>
              <button type="button" className="ag-mini-btn" onClick={test} disabled={!urlOk || !keyOk || testing}>
                {testing ? <span className="ag-spin" /> : "Test connection"}
              </button>
              {result === "ok" ? (
                <p className="ag-ok">
                  <CheckIcon /> Connected · 42ms
                </p>
              ) : null}
              {result === "fail" ? <p className="ag-err">Server refused the key</p> : null}
            </div>
          </>
        ) : (
          <>
            <span className="ag-wel-mark">
              <CheckIcon />
            </span>
            <p className="ag-wel-t">Ready</p>
            <p className="ag-wel-s">Ask anything. Approve edits as they come.</p>
          </>
        )}
      </div>
      <div className="ag-wel-foot">
        <div className="ag-wel-dots" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className={step === i ? "ag-wel-dot on" : "ag-wel-dot"} />
          ))}
        </div>
        <div className="ag-wel-nav">
          {step > 0 ? (
            <button type="button" className="ag-mini-btn" onClick={() => setStep((s) => s - 1)}>
              Back
            </button>
          ) : null}
          {step < 2 ? (
            <button
              type="button"
              className="ag-btn primary full"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && result !== "ok"}
            >
              Continue
            </button>
          ) : (
            <button type="button" className="ag-btn green full" onClick={onDone}>
              Start building
            </button>
          )}
        </div>
        <button type="button" className="ag-wel-skip" onClick={onDone}>
          Skip
        </button>
      </div>
    </div>
  );
}
