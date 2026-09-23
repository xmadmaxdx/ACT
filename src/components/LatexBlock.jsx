import { useMemo, useState } from "react";
import MathText from "./MathText.jsx";
import { healTex } from "../latexHeal.js";

// Display-math block with a pre-pass healer. Parsable input renders as
// math; anything KaTeX still rejects becomes a copy-out error card so an
// AI agent can grab the raw block and fix it.
export default function LatexBlock({ tex, label }) {
  const [copied, setCopied] = useState(false);
  const healed = useMemo(() => healTex(tex), [tex]);

  const copyRaw = async () => {
    const raw = String(tex || "");
    try {
      await navigator.clipboard.writeText(raw);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = raw;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (healed.errors.length === 0) {
    const text = healed.mode === "display" ? `$$${healed.text}$$` : healed.text;
    return <MathText text={text} />;
  }

  return (
    <div className="latex-error" role="alert">
      <p className="latex-error-head">{label || "LaTeX needs a fix"}</p>
      <pre className="latex-error-code">{String(tex || "")}</pre>
      <button type="button" className="latex-copy-btn" onClick={copyRaw}>
        {copied ? "COPIED ✓" : "COPY LATEX"}
      </button>
    </div>
  );
}
