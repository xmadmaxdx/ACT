// Root state of the Codino Agent: hero, suggestion cards, status, composer.

import { useState } from "react";
import { QUICK, SUGGESTIONS } from "./data.js";
import { BoltIcon, CheckIcon, SparkIcon, WrenchIcon } from "./icons.jsx";
import { Composer } from "./Composer.jsx";

const GLYPHS = {
  debug: <WrenchIcon />,
  build: <BoltIcon size={21} />,
  tests: <CheckIcon />,
  learn: <SparkIcon size={21} />,
};

const TILES = {
  debug: "t-amber",
  build: "t-green",
  tests: "t-blue",
  learn: "t-purple",
};

export function RootView({ onSend }) {
  const [value, setValue] = useState("");
  const [attach, setAttach] = useState(null);

  const send = () => {
    const v = value.trim();
    if (!v && !attach) return;
    onSend(v || "What's in this photo?", attach);
    setValue("");
    setAttach(null);
  };

  return (
    <>
      <div className="ag-body">
        <div className="ag-hero">
          <span className="ag-mark rise" aria-hidden="true">
            <BoltIcon size={34} />
          </span>
          <h2 className="ag-hello rise d1">
            Build <span>anything</span>
          </h2>
          <p className="ag-sub rise d1">Reads, runs and edits your code.</p>
          <div className="ag-grid">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`ag-song rise d${Math.min(i + 1, 4)}`}
                onClick={() => setValue(s.text)}
              >
                <span className={`ag-tile ${TILES[s.id]}`} aria-hidden="true">
                  {GLYPHS[s.id]}
                </span>
                <span className="ag-song-t">{s.title}</span>
                <span className="ag-song-s">{s.sub}</span>
              </button>
            ))}
          </div>
          <p className="ag-status rise d4">
            <span className="dot" aria-hidden="true" /> Server online · Codino 1
          </p>
        </div>
      </div>
      <div className="ag-foot">
        <Composer
          value={value}
          onChange={setValue}
          placeholder="Ask Codino…"
          quick={QUICK}
          onSend={send}
          canSend={value.trim().length > 0 || !!attach}
          attach={attach}
          onClearAttach={() => setAttach(null)}
          onPickAttach={setAttach}
        />
      </div>
    </>
  );
}
