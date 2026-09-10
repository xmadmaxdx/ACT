import katex from "katex";
import "katex/dist/katex.min.css";

function texNode(tex, display, key) {
  let html = tex;
  try {
    html = katex.renderToString(tex, { throwOnError: false, displayMode: display });
  } catch {
    html = tex;
  }
  return (
    <span
      key={key}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/* Inline *italic* markup for non-math runs (matches TestScreen rich()). */
function italicRich(text, keyPrefix) {
  return String(text)
    .split(/__([^_]+?)__/g)
    .map((seg, si) =>
      si % 2 === 1 ? (
        <span key={`${keyPrefix}-u-${si}`} className="u-mark">{seg}</span>
      ) : (
        <span key={`${keyPrefix}-s-${si}`}>
          {String(seg)
            .split(/\*([^*]+)\*/g)
            .map((part, i) =>
              i % 2 === 1 ? (
                <em key={`${keyPrefix}-em-${i}`}>{part}</em>
              ) : (
                <span key={`${keyPrefix}-t-${i}`}>{part}</span>
              )
            )}
        </span>
      )
    );
}

/* Renders strings mixing prose, $inline$ and $$display$$ LaTeX. */
export function mathRich(text) {
  const out = [];
  const displays = String(text).split(/\$\$([\s\S]+?)\$\$/g);
  let k = 0;
  displays.forEach((chunk, di) => {
    if (di % 2 === 1) {
      out.push(texNode(chunk, true, `d${k++}`));
      return;
    }
    chunk.split(/\$([^$]+?)\$/g).forEach((part, i) => {
      if (i % 2 === 1) out.push(texNode(part, false, `m${k++}`));
      else if (part) out.push(<span key={`t${k++}`}>{italicRich(part, `r${k}`)}</span>);
    });
  });
  return out;
}

export default function MathText({ text, className }) {
  return <span className={className}>{mathRich(text)}</span>;
}
