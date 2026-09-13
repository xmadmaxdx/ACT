// Codino AI — mini-markup renderer for AI answers. Dep-free, XSS-safe (React
// text nodes only, never innerHTML). Contract the model must follow:
//   TIP: advice on its own line      -> amber tip callout
//   - point on its own line          -> blue bullet list
//   QUOTE: "exact passage words"     -> evidence card verified against the
//                                        real passage: +/-2 sentences shown,
//                                        cited words highlighted. Only renders
//                                        as a card when the closing quote is
//                                        present, so partial streams fall back
//                                        to plain paragraphs safely.

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
    return <span key={`${keyBase}-t${i}`}>{p}</span>;
  });
}

function splitSentences(text) {
  const parts = String(text || "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : [String(text || "").trim()].filter(Boolean);
}

function Evidence({ quote, passage }) {
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
    body = <span>{window}</span>;
  } else {
    body = (
      <>
        <span>{window.slice(0, at)}</span>
        <mark className="cod-ev-hit">{window.slice(at, at + qi.length)}</mark>
        <span>{window.slice(at + qi.length)}</span>
      </>
    );
  }
  return (
    <figure className="cod-ev" key={qi}>
      <figcaption className="cod-ev-top">From the passage</figcaption>
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

const isTip = (t) => /^TIP:\s*\S/.test(t);
const isQuote = (t) => /^QUOTE:\s*".*"\s*$/.test(t);
const isBullet = (t) => /^[-•]\s+\S/.test(t);

export function renderAiText(text, passage) {
  const lines = String(text || "").split("\n");
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
    const t = lines[i].trim();
    if (!t) {
      flushBullets();
      continue;
    }
    if (isQuote(t)) {
      flushBullets();
      out.push(<Evidence key={`q${k++}`} quote={t.replace(/^QUOTE:\s*"/, "").replace(/"\s*$/, "")} passage={passage} />);
      continue;
    }
    if (isTip(t)) {
      flushBullets();
      const tipLines = [t.replace(/^TIP:\s*/, "")];
      while (i + 1 < lines.length) {
        const nx = lines[i + 1].trim();
        if (!nx || isTip(nx) || isQuote(nx) || isBullet(nx)) break;
        tipLines.push(lines[++i].trim());
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
        {renderInline(lines[i].trim(), `p${k}`)}
      </p>
    );
  }
  flushBullets();
  return out;
}
