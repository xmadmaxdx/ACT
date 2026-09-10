import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

const BoardTextEditor = forwardRef(function BoardTextEditor(
  { x, y, fontSize, color, initialValue, onCommit, onCancel },
  ref
) {
  const [value, setValue] = useState(initialValue || "");
  const areaRef = useRef(null);
  const focusedRef = useRef(false);
  const valueRef = useRef(initialValue || "");
  valueRef.current = value;

  useImperativeHandle(
    ref,
    () => ({
      commit: () => {
        onCommit(valueRef.current);
      },
      cancel: () => {
        onCancel();
      },
    }),
    [onCommit, onCancel]
  );

  useEffect(() => {
    const el = areaRef.current;
    if (el) {
      el.focus({ preventScroll: true });
      el.select();
    }
  }, []);

  const doCommit = () => {
    onCommit(valueRef.current);
  };

  return (
    <div className="board-editor-box" style={{ left: x, top: y }}>
      <textarea
        ref={areaRef}
        className="board-text-editor"
        autoFocus
        rows={3}
        value={value}
        placeholder="Type here…"
        style={{ fontSize, color }}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => {
          focusedRef.current = true;
        }}
        onBlur={() => {
          if (focusedRef.current) {
            focusedRef.current = false;
            doCommit();
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            e.preventDefault();
            onCancel();
          } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            doCommit();
          }
        }}
      />
      <div className="board-editor-actions">
        <button
          type="button"
          className="board-editor-btn done"
          onMouseDown={(e) => e.preventDefault()}
          onClick={doCommit}
        >
          ✓ Done
        </button>
        <button
          type="button"
          className="board-editor-btn cancel"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onCancel}
        >
          ✕
        </button>
      </div>
    </div>
  );
});

export default BoardTextEditor;
