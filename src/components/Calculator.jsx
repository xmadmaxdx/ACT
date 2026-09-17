import { useEffect, useRef, useState } from "react";
import { DesmosCalc } from "./DesmosCalc.jsx";
import FreestyleBoard from "./FreestyleBoard.jsx";

const MODES = ["graph", "board"];
const LABELS = { graph: "Graph", board: "Board" };

/* Standalone calculator studio: fullscreen Desmos + whiteboard. Params all
   degrade gracefully — bad initialMode falls back to graph, missing onClose
   hides the cross, showTabs={false} locks the initial mode. */
export default function Calculator({ initialMode, onClose, showTabs }) {
  const start = MODES.includes(initialMode) ? initialMode : "graph";
  const tabs = showTabs === false ? [start] : MODES;
  const [mode, setMode] = useState(start);
  const [headHidden, setHeadHidden] = useState(false);
  const boardStore = useRef({});
  const boardApiRef = useRef(null);
  const desmosApiRef = useRef(null);

  useEffect(() => {
    if (!onClose) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="calc-fullscreen" role="dialog" aria-label="Calculator studio">
      {!headHidden && (
      <div className="calc-full-head">
        <div className="calc-tabs" role="tablist" aria-label="Calculator type">
          {tabs.map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              className={mode === m ? "calc-tab active" : "calc-tab"}
              onClick={() => setMode(m)}
            >
              {LABELS[m]}
            </button>
          ))}
        </div>
        {onClose && (
          <button type="button" className="calc-cross" aria-label="Close calculator" onClick={onClose}>
            ✕
          </button>
        )}
      </div>
      )}
      <div className="calc-full-body">
        {mode === "board" ? (
          <FreestyleBoard
            qkey="studio"
            store={boardStore}
            apiRef={boardApiRef}
            toolbarExtra={
              <span className="board-collapse">
                <button
                  type="button"
                  className="board-tool"
                  onClick={() => setHeadHidden((v) => !v)}
                  title={headHidden ? "Show studio header" : "Hide studio header"}
                  aria-label={headHidden ? "Show studio header" : "Hide studio header"}
                  aria-pressed={headHidden}
                >
                  {headHidden ? (
                    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M3 10L8 5l5 5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </span>
            }
          />
        ) : (
          <DesmosCalc mode={mode} apiRef={desmosApiRef} />
        )}
      </div>
    </div>
  );
}
