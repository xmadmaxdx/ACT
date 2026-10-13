// Composer for the Codino Agent: auto-grow input, quick prompts, slash
// picker, attachments, mock dictation. Send swaps to Stop while streaming.

import { useEffect, useRef, useState } from "react";
import { SLASH } from "./data.js";
import { CameraIcon, CloseIcon, FileIcon, MicIcon, PhotoIcon, PlusIcon, SendIcon, StopIcon } from "./icons.jsx";
import { AgSheet } from "./bits.jsx";

function newBars() {
  return Array.from({ length: 22 }, () => 5 + Math.round(Math.random() * 22));
}

export function Composer({
  value,
  onChange,
  placeholder,
  quick,
  streaming,
  onStop,
  onSend,
  canSend,
  attach,
  onClearAttach,
  onPickAttach,
  replyCtx,
  onCancelCtx,
}) {
  const [sheet, setSheet] = useState(false);
  const [rec, setRec] = useState(null);
  const [bars, setBars] = useState([]);
  const recRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(
    () => () => {
      if (recRef.current) window.clearInterval(recRef.current);
    },
    []
  );

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 92)}px`;
  }, [value]);

  const showSlash = value.startsWith("/") && !value.includes(" ");
  const slashList = SLASH.filter((s) => s.cmd.startsWith(value.toLowerCase()));

  const startRec = () => {
    setBars(newBars());
    setRec(0);
    recRef.current = window.setInterval(() => {
      setRec((s) => (s === null ? s : s + 0.2));
      setBars(newBars());
    }, 200);
  };

  const stopRec = (sendIt) => {
    if (recRef.current) window.clearInterval(recRef.current);
    recRef.current = null;
    const heard = rec || 0;
    setRec(null);
    if (sendIt && heard >= 0.8) {
      const add = "Explain event loops simply";
      onChange(value.trim() ? `${value.trim()} ${add}` : add);
      inputRef.current?.focus();
    }
  };

  return (
    <>
      {replyCtx ? (
        <div className="ag-ctxbar">
          <span className="bar" />
          <span className="ag-ctxbar-b">
            <span className="ag-ctxbar-k">{replyCtx.k}</span>
            <span className="ag-ctxbar-t">{replyCtx.t}</span>
          </span>
          <button type="button" className="ag-ctxx" onClick={onCancelCtx} aria-label="Dismiss">
            <CloseIcon />
          </button>
        </div>
      ) : null}
      {attach ? (
        <div className="ag-ctxbar">
          <span className="bar" />
          <span className="ag-ctxbar-b">
            <span className="ag-ctxbar-k">Attached</span>
            <span className="ag-ctxbar-t">{attach.name}</span>
          </span>
          <button type="button" className="ag-ctxx" onClick={onClearAttach} aria-label="Remove attachment">
            <CloseIcon />
          </button>
        </div>
      ) : null}

      {quick && quick.length > 0 ? (
        <div className="ag-quick" aria-label="Quick prompts">
          {quick.map((q) => (
            <button key={q} type="button" className="ag-chip" onClick={() => onChange(q)}>
              {q}
            </button>
          ))}
        </div>
      ) : null}

      {rec !== null ? (
        <div className="ag-rec" role="status" aria-label="Recording">
          <span className="ag-rec-dot" aria-hidden="true" />
          <span className="ag-rec-t">
            {Math.floor(rec / 60)}:{String(Math.floor(rec % 60)).padStart(2, "0")}
          </span>
          <span className="ag-rec-bars" aria-hidden="true">
            {bars.map((h, i) => (
              <i key={i} style={{ height: `${h}px` }} />
            ))}
          </span>
          <button type="button" className="ag-ctxx" onClick={() => stopRec(false)} aria-label="Cancel">
            <CloseIcon />
          </button>
          <button type="button" className="ag-send on" onClick={() => stopRec(true)} aria-label="Dictate">
            <SendIcon />
          </button>
        </div>
      ) : (
        <div className="ag-composer">
          {showSlash && slashList.length > 0 ? (
            <div className="ag-slash" role="listbox" aria-label="Commands">
              {slashList.map((s) => (
                <button
                  key={s.cmd}
                  type="button"
                  className="ag-slashrow"
                  onClick={() => {
                    onChange(`${s.cmd} `);
                    inputRef.current?.focus();
                  }}
                >
                  <b>{s.cmd}</b>
                  <span>{s.desc}</span>
                </button>
              ))}
            </div>
          ) : null}
          <button type="button" className="ag-cbtn" onClick={() => setSheet(true)} aria-label="Attach">
            <PlusIcon />
          </button>
          <div className="ag-field">
            <textarea
              ref={inputRef}
              className="ag-input"
              value={value}
              rows={1}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              placeholder={placeholder}
              aria-label={placeholder}
              maxLength={500}
            />
            <button type="button" className="ag-ctxx" onClick={startRec} aria-label="Voice input">
              <MicIcon />
            </button>
          </div>
          {streaming ? (
            <button type="button" className="ag-send stop" onClick={onStop} aria-label="Stop generating">
              <StopIcon />
            </button>
          ) : (
            <button
              type="button"
              className={canSend ? "ag-send on" : "ag-send"}
              onClick={onSend}
              disabled={!canSend}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          )}
        </div>
      )}
      <div className="ag-composer-foot">
        <span className={value.length > 450 ? "ag-char warn" : "ag-char"}>
          {value.length} / 500
        </span>
      </div>

      {sheet ? (
        <AgSheet title="Attach" onClose={() => setSheet(false)}>
          <button
            type="button"
            className="ag-sheetrow"
            onClick={() => {
              setSheet(false);
              onPickAttach({ kind: "photo", name: "screenshot.png" });
            }}
          >
            <span className="ag-sheet-ic">
              <PhotoIcon />
            </span>
            <span className="ag-sheet-l">
              <span className="ag-sheet-t">Photo library</span>
            </span>
          </button>
          <button
            type="button"
            className="ag-sheetrow"
            onClick={() => {
              setSheet(false);
              onPickAttach({ kind: "photo", name: "camera-shot.jpg" });
            }}
          >
            <span className="ag-sheet-ic">
              <CameraIcon />
            </span>
            <span className="ag-sheet-l">
              <span className="ag-sheet-t">Take photo</span>
            </span>
          </button>
          <button
            type="button"
            className="ag-sheetrow"
            onClick={() => {
              setSheet(false);
              onPickAttach({ kind: "file", name: "stack-trace.txt" });
            }}
          >
            <span className="ag-sheet-ic">
              <FileIcon />
            </span>
            <span className="ag-sheet-l">
              <span className="ag-sheet-t">File</span>
            </span>
          </button>
        </AgSheet>
      ) : null}
    </>
  );
}
