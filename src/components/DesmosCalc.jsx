import { useEffect, useRef, useState } from "react";

/* Shared Desmos loader + embed. Extracted from TestScreen so the standalone
   Calculator studio and in-test panels use one script tag and one API shape. */

const DESMOS_KEY =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_DESMOS_API_KEY) ||
  "c6f78eb83b074ebcac28827b8e5ebea2";

let desmosPromise = null;

function loadDesmos() {
  if (typeof window !== "undefined" && window.Desmos) return Promise.resolve();
  if (!desmosPromise) {
    desmosPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `https://www.desmos.com/api/v1.12/calculator.js?apiKey=${DESMOS_KEY}`;
      s.async = true;
      s.onload = () => {
        if (window.Desmos) resolve();
        else {
          desmosPromise = null;
          reject(new Error("Desmos API loaded but unavailable"));
        }
      };
      s.onerror = () => {
        desmosPromise = null;
        reject(new Error("Desmos script failed to load"));
      };
      document.head.appendChild(s);
    });
  }
  return desmosPromise;
}

export function preloadDesmos() {
  loadDesmos().catch(() => {});
}

export function DesmosCalc({ mode, apiRef, initialState, onSnapshot }) {
  const elRef = useRef(null);
  const calcRef = useRef(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    const settledLayout = () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
    loadDesmos()
      .then(() => settledLayout())
      .then(() => {
        if (cancelled || !elRef.current || !window.Desmos) {
          throw new Error("unavailable");
        }
        const api =
          mode === "scientific"
            ? window.Desmos.ScientificCalculator(elRef.current)
            : window.Desmos.GraphingCalculator(elRef.current);
        calcRef.current = api;
        if (apiRef) apiRef.current = api;
        try {
          if (initialState) api.setState(initialState);
        } catch (err) {
          window.console.debug("desmos initial state skipped", err);
        }
        if (!cancelled) setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      const c = calcRef.current;
      calcRef.current = null;
      if (apiRef) apiRef.current = null;
      if (c) {
        if (onSnapshot) {
          try {
            onSnapshot(c.getState());
          } catch (err) {
            window.console.debug("desmos snapshot skipped", err);
          }
        }
        if (typeof c.destroy === "function") c.destroy();
      }
    };
  }, [mode]);

  return (
    <div className="desmos-wrap">
      <div className="desmos-box" ref={elRef} />
      {status === "loading" && (
        <div className="desmos-loading" role="status">
          <span className="desmos-spinner" aria-hidden="true" />
          <span>Loading calculator…</span>
        </div>
      )}
      {status === "error" && (
        <div className="desmos-loading" role="alert">
          <span>Couldn't load the calculator. Check your connection, close it, and reopen.</span>
        </div>
      )}
    </div>
  );
}
