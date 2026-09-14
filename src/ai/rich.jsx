// Codino AI — mini-markup renderer for AI answers. Dep-free, XSS-safe (React
// text nodes only, never innerHTML). Contract the model must follow:
//   TIP: advice on its own line      -> amber tip callout
//   - point on its own line          -> blue bullet list
//   QUOTE: "exact passage words"     -> evidence card verified against the
//                                        real passage (+/-2 sentences shown,
//                                        cited words highlighted)
//   OPTION: B on its own line        -> designed option card; review mode
//                                        animates it (check-draw when right,
//                                        elimination sweep when wrong)
// Markers ONLY work standing alone on their own line. Inside a bullet, tip,
// or paragraph they are denied and render as literal text — never a card.

import { mathRich } from "../components/MathText.jsx";

function renderInline(text, keyBase) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.length > 4 && p.startsWith("**") && p.endsWith("**")) {
      return <strong key={`${keyBase}-b${i}`}>{p.slice(2, -2)}</strong>;
    }
    if (p.length > 2 && p.startsWith("`") && p.endsWith("`")) {
      return (
        <code key={`${keyBase}-c${i}`} className="cod-ai-code">
          {p.slice(1, -1)}
        </code>
      );
    }
    return <span key={`${keyBase}-t${i}`}>{mathRich(p)}</span>;
  });
}

// Models emit \(...\) / \[...\] and leak \uXXXX escapes; the app renders
// $...$ / $$...$$. Normalize AI lines into the app's dialect first.
function decodeModelLine(line) {
  return String(line)
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\\[/g, "$$")
    .replace(/\\\]/g, "$$")
    .replace(/\\\(/g, "$")
    .replace(/\\\)/g, "$");
}

function splitSentences(text) {
  const parts = String(text || "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : [String(text || "").trim()].filter(Boolean);
}

function Evidence({ quote, passage, label }) {
  const qi = String(quote || "").trim();
  const sents = splitSentences(passage);
  const needle = qi.toLowerCase().slice(0, 48);
  const hit = needle ? sents.findIndex((s) => s.toLowerCase().includes(needle)) : -1;
  if (hit < 0 || !qi) {
    return <blockquote className="cod-ai-quote">&ldquo;{qi || "…"}&rdquo;</blockquote>;
  }
  const window = sents.slice(Math.max(0, hit - 2), hit + 3).join(" ");
  const at = window.toLowerCase().indexOf(qi.toLowerCase());
  let body;
  if (at < 0) {
    body = <span>{mathRich(window)}</span>;
  } else {
    body = (
      <>
        <span>{mathRich(window.slice(0, at))}</span>
        <mark className="cod-ev-hit">{mathRich(window.slice(at, at + qi.length))}</mark>
        <span>{mathRich(window.slice(at + qi.length))}</span>
      </>
    );
  }
  return (
    <figure className="cod-ev" key={qi}>
      <figcaption className="cod-ev-top">{label || "From the passage"}</figcaption>
      <blockquote className="cod-ev-body">{body}</blockquote>
    </figure>
  );
}

function TipBulb() {
  return (
    <svg className="cod-tip-bulb" width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 1.2a4.6 4.6 0 0 0-2.7 8.3c.7.6 1.2 1.1 1.2 2.2h3c0-1.1.5-1.6 1.2-2.2A4.6 4.6 0 0 0 8 1.2zM6.7 13.4h2.6M7.2 15h1.6"
        fill="#f5c044"
        stroke="#b25e09"
        strokeWidth="1.3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function OptCard({ letter, text, state }) {
  return (
    <div className={`cod-optcard is-${state}`}>
      <span className="cod-optcard-badge" aria-hidden="true">
        {state === "correct" ? (
          <svg width="14" height="14" viewBox="0 0 16 16">
            <path
              className="cod-check-path"
              d="M3 8.5l3.2 3.2L13 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : state === "picked" ? (
          <svg width="13" height="13" viewBox="0 0 16 16">
            <path
              d="M4 4l8 8M12 4l-8 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          letter
        )}
      </span>
      <span className="cod-optcard-text">
        <b>{letter}.</b> {text}
      </span>
    </div>
  );
}

const isTip = (t) => /^TIP:\s*\S/.test(t);
const isQuote = (t) => /^QUOTE:\s*".*"\s*$/.test(t);
const isOption = (t) => /^OPTION:\s*[A-Za-z]\s*$/.test(t);
const isBullet = (t) => /^[-•]\s+\S/.test(t);

export function renderAiText(text, passage, opts, evidenceLabel) {
  const byLetter = new Map((opts || []).map((o) => [String(o.letter).toUpperCase(), o]));
  const rawLines = String(text || "").split("\n");
  // Rejoin fenced math split across lines: a lone $ or $$ line opens a fence
  // closed by the next lone $ or $$ line; the joined block renders as one
  // KaTeX span. Unclosed fences still get wrapped so nothing shows literally.
  const lines = [];
  for (let j = 0; j < rawLines.length; j++) {
    const fence = rawLines[j].trim();
    if (fence === "$" || fence === "$$") {
      let block = "";
      j += 1;
      while (j < rawLines.length) {
        const edge = rawLines[j].trim();
        if (edge === "$" || edge === "$$") break;
        block += `${rawLines[j]}\n`;
        j += 1;
      }
      if (block.trim()) lines.push(`${fence}${block.trim()}${fence}`);
      continue;
    }
    lines.push(rawLines[j]);
  }
  const out = [];
  let bullets = [];
  let k = 0;
  const flushBullets = () => {
    if (!bullets.length) return;
    out.push(
      <ul key={`l${k++}`} className="cod-ai-list">
        {bullets.map((b, i) => (
          <li key={i}>{renderInline(b, `l${k}i${i}`)}</li>
        ))}
      </ul>
    );
    bullets = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const decoded = decodeModelLine(lines[i]);
    const t = decoded.trim();
    if (!t) {
      flushBullets();
      continue;
    }
    if (isQuote(t)) {
      flushBullets();
      out.push(<Evidence key={`q${k++}`} quote={t.replace(/^QUOTE:\s*"/, "").replace(/"\s*$/, "")} passage={passage} label={evidenceLabel} />);
      continue;
    }
    if (isOption(t)) {
      flushBullets();
      const letter = t.replace(/^OPTION:\s*/i, "").trim().toUpperCase();
      const found = byLetter.get(letter);
      if (!found) {
        out.push(
          <p key={`p${k++}`} className="cod-ai-p">
            {renderInline(t, `p${k}`)}
          </p>
        );
      } else {
        out.push(<OptCard key={`o${k++}`} letter={found.letter} text={found.text} state={found.state} />);
      }
      continue;
    }
    if (isTip(t)) {
      flushBullets();
      const tipLines = [t.replace(/^TIP:\s*/, "")];
      while (i + 1 < lines.length) {
        const nx = decodeModelLine(lines[i + 1]).trim();
        if (!nx || isTip(nx) || isQuote(nx) || isBullet(nx)) break;
        i += 1;
        tipLines.push(decodeModelLine(lines[i]).trim());
      }
      out.push(
        <div key={`t${k++}`} className="cod-tip">
          <TipBulb />
          <span>{renderInline(tipLines.join(" "), `t${k}`)}</span>
        </div>
      );
      continue;
    }
    if (isBullet(t)) {
      bullets.push(t.replace(/^[-•]\s+/, ""));
      continue;
    }
    flushBullets();
    out.push(
      <p key={`p${k++}`} className="cod-ai-p">
        {renderInline(t, `p${k}`)}
      </p>
    );
  }
  flushBullets();
  return out;
}
