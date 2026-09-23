import { useEffect, useRef, useState } from "react";
import { createShareLink, SHARE_EXPIRY_OPTIONS } from "../supabase.js";

const ROW_H = 40;
const VIEW_H = 120;
const VIEW_PAD = (VIEW_H - ROW_H) / 2;

function SaveIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" aria-hidden="true">
      <path
        d="M4.5 2h8a1 1 0 0 1 1 1v11.5a.8.8 0 0 1-1.3.6L8.5 12l-3.7 3.1a.8.8 0 0 1-1.3-.6V3a1 1 0 0 1 1-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckArt() {
  return (
    <svg className="save-check-art" width="54" height="54" viewBox="0 0 54 54" aria-hidden="true">
      <circle
        className="save-check-ring"
        cx="27"
        cy="27"
        r="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
      />
      <path
        className="save-check-path"
        d="M17 27.5l7 7L37 21"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner() {
  return <span className="save-spinner" aria-hidden="true" />;
}

export default function SaveLink({ testData }) {
  const [open, setOpen] = useState(false);
  const [daysIdx, setDaysIdx] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const remembered = useRef({});
  const wheelRef = useRef(null);
  const copyT = useRef(null);

  useEffect(
    () => () => {
      if (copyT.current) clearTimeout(copyT.current);
    },
    []
  );

  const openDialog = () => {
    const prior = testData ? remembered.current[testData.id] : null;
    setResult(prior || null);
    setPhase(prior ? "done" : "idle");
    setError("");
    setCopied(false);
    if (prior) {
      const i = Math.max(
        0,
        SHARE_EXPIRY_OPTIONS.findIndex((o) => o.days === prior.days)
      );
      setDaysIdx(i);
    }
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setPhase("idle");
    setError("");
  };

  useEffect(() => {
    if (open && wheelRef.current) {
      wheelRef.current.scrollTop = daysIdx * ROW_H;
    }
  }, [open]);

  const reducedMotion = () =>
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onWheelScroll = () => {
    const el = wheelRef.current;
    if (!el) return;
    const i = Math.min(
      SHARE_EXPIRY_OPTIONS.length - 1,
      Math.max(0, Math.round(el.scrollTop / ROW_H))
    );
    setDaysIdx((prev) => (prev === i ? prev : i));
  };

  const pickRow = (i) => {
    setDaysIdx(i);
    if (wheelRef.current) {
      wheelRef.current.scrollTo({ top: i * ROW_H, behavior: reducedMotion() ? "auto" : "smooth" });
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      window.console.debug("share copy fallback", err);
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    if (copyT.current) clearTimeout(copyT.current);
    copyT.current = setTimeout(() => setCopied(false), 2000);
  };

  const generate = async () => {
    if (!testData) return;
    setPhase("working");
    setError("");
    try {
      const res = await createShareLink({
        section: testData.section,
        title: testData.title,
        test: testData,
        days: SHARE_EXPIRY_OPTIONS[daysIdx].days,
      });
      remembered.current[testData.id] = res;
      setResult(res);
      setPhase("done");
      copyText(res.url);
    } catch (e) {
      setError(e && e.message ? e.message : "Could not create the link.");
      setPhase("error");
    }
  };

  const expiryLine = result
    ? `Expires ${new Date(result.expiresAt).toLocaleString()} · ${result.label}`
    : "";

  return (
    <>
      <button
        className="save-btn"
        type="button"
        aria-label="Save test link"
        title="Save test link"
        onClick={openDialog}
      >
        <SaveIcon />
        <span>Save</span>
      </button>
      {open && (
        <div className="save-overlay" onClick={closeDialog}>
          <div
            className="save-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Save test link"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              aria-label="Close save dialog"
              onClick={closeDialog}
            >
              ✕
            </button>
            {phase === "done" && result ? (
              <div className="save-done rise">
                <CheckArt />
                <p className="save-kicker">LINK READY{copied ? " — COPIED ✓" : ""}</p>
                <p className="save-url">{result.url}</p>
                <p className="save-expiry">{expiryLine}</p>
                <div className="save-actions">
                  <button type="button" className="btn-primary save-main" onClick={() => copyText(result.url)}>
                    {copied ? "COPIED ✓" : "COPY LINK"}
                  </button>
                  <div className="save-subrow">
                    <button type="button" className="footer-link" onClick={() => { setResult(null); setPhase("idle"); setError(""); }}>
                      Make a new one
                    </button>
                    <button type="button" className="footer-link" onClick={closeDialog}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rise">
                <p className="save-kicker">SAVE TEST LINK</p>
                <h3 className="save-title">Link expires in</h3>
                <div
                  className="save-wheel"
                  ref={wheelRef}
                  onScroll={onWheelScroll}
                  role="listbox"
                  aria-label="Link expiry"
                >
                  <div className="save-wheel-pad" aria-hidden="true" />
                  {SHARE_EXPIRY_OPTIONS.map((o, i) => (
                    <button
                      key={o.days}
                      type="button"
                      role="option"
                      aria-selected={daysIdx === i}
                      className={daysIdx === i ? "save-wheel-row on" : "save-wheel-row"}
                      onClick={() => pickRow(i)}
                    >
                      {o.label}
                    </button>
                  ))}
                  <div className="save-wheel-pad" aria-hidden="true" />
                </div>
                <button
                  type="button"
                  className="btn-primary save-main"
                  onClick={generate}
                  disabled={phase === "working"}
                >
                  {phase === "working" ? (
                    <>
                      <Spinner /> SAVING…
                    </>
                  ) : (
                    "GENERATE LINK"
                  )}
                </button>
                {phase === "error" && error && <p className="save-error">{error}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
