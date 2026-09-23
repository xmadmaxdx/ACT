import katex from "katex";

function balanceBraces(src) {
  let depth = 0;
  for (const ch of src) {
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth < 0) return null;
    }
  }
  if (depth > 0) return src + "}".repeat(depth);
  return src;
}

function tryTex(tex, displayMode) {
  try {
    katex.renderToString(tex, { throwOnError: true, displayMode });
    return true;
  } catch {
    return false;
  }
}

function healSegment(seg) {
  const cands = [seg];
  const balanced = balanceBraces(seg);
  if (balanced && balanced !== seg) cands.push(balanced);
  const unwrapped = seg.replace(/^\$+|\$+$/g, "");
  if (unwrapped !== seg) {
    cands.push(unwrapped);
    const b2 = balanceBraces(unwrapped);
    if (b2 && b2 !== unwrapped) cands.push(b2);
  }
  for (const c of cands) {
    if (c.length > 0 && tryTex(c, false)) return { tex: c, healed: c !== seg };
  }
  return null;
}

// Options often arrive as bare LaTeX without $ delimiters
// ("y=\pm\frac{3}{4}x"). Detect and wrap so they render as math.
export function healOption(src) {
  const t = String(src || "");
  if (!t || t.indexOf("$") >= 0) return t;
  if (!/\\[a-zA-Z]|[\^_]/.test(t)) return t;
  const wrapped = `$${t}$`;
  try {
    katex.renderToString(t, { throwOnError: true, displayMode: false });
    return wrapped;
  } catch {
    return t;
  }
}

// Pre-pass for theory formula/math blocks. AI content often mixes prose
// with $inline$ math inside a display block, which KaTeX rejects. Split,
// heal each math segment, and pick the render mode that parses.
export function healTex(src) {
  const raw = String(src || "").trim();
  if (!raw) return { mode: "display", text: "", healed: false, errors: ["empty"] };
  const parts = raw.split(/\$([^$]+?)\$/g);
  if (parts.length === 1) {
    const clean = raw.replace(/^\$+|\$+$/g, "").trim();
    if (tryTex(clean, true)) return { mode: "display", text: clean, healed: clean !== raw, errors: [] };
    const balanced = balanceBraces(clean);
    if (balanced && balanced !== clean && tryTex(balanced, true)) {
      return { mode: "display", text: balanced, healed: true, errors: [] };
    }
    return { mode: "display", text: clean, healed: false, errors: ["unparsable"] };
  }
  const errors = [];
  let healed = false;
  const out = parts.map((part, i) => {
    if (i % 2 === 0) return part;
    const fixed = healSegment(part.trim());
    if (!fixed) {
      errors.push(part);
      return part;
    }
    if (fixed.healed) healed = true;
    return fixed.tex;
  });
  return { mode: "mixed", text: out.join("$"), healed, errors };
}
