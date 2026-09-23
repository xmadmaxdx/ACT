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

// A line that is purely one formula (with or without $ delimiters).
// Returns bare display-ready tex, or null for mixed/prose lines.
export function aloneDisplayTex(line) {
  const s = String(line || "").trim();
  if (!s) return null;
  const d = /^\$\$([\s\S]+)\$\$$/.exec(s);
  if (d) return d[1].trim();
  const segs = healBareRuns(s);
  if (segs.length === 1 && segs[0].m !== undefined) return segs[0].m;
  const single = /^\$([^$]+)\$$/.exec(s);
  if (single) return single[1].trim();
  return null;
}

const BULLET_RE = /^(?:[-•+]\s+|\d+[.)]\s+)([\s\S]*)$/;

// Block parser for strategy/step bodies: paragraphs, bullet lists, and
// standalone display formulas. Pure logic — rendering lives in StepBody.
export function parseBlocks(text) {
  const blocks = [];
  let para = [];
  let list = [];
  const flushPara = () => {
    if (para.length) {
      blocks.push({ kind: "p", text: para.join("\n") });
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push({ kind: "ul", items: list });
      list = [];
    }
  };
  for (const raw of String(text || "").split("\n")) {
    const t = raw.trim();
    if (!t) {
      flushPara();
      flushList();
      blocks.push({ kind: "gap" });
      continue;
    }
    const b = BULLET_RE.exec(t);
    if (b) {
      flushPara();
      list.push(b[1]);
      continue;
    }
    flushList();
    const tex = aloneDisplayTex(t);
    if (tex !== null && tex.length > 0) {
      flushPara();
      blocks.push({ kind: "math", tex });
      continue;
    }
    para.push(raw);
  }
  flushPara();
  flushList();
  return blocks;
}
export function healBareRuns(text) {
  const out = [];
  const re = /[^\s$]*?(?:\\[a-zA-Z]|[\^_])[^\s$]*/g;
  const s = String(text);
  let last = 0;
  let m;
  for (;;) {
    m = re.exec(s);
    if (!m) break;
    if (m.index > last) out.push({ t: s.slice(last, m.index) });
    const cand = m[0];
    if (cand.length > 0 && cand.length <= 160 && tryTex(cand, false)) out.push({ m: cand });
    else out.push({ t: cand });
    last = m.index + cand.length;
    if (re.lastIndex === m.index) re.lastIndex++;
  }
  if (last < s.length) out.push({ t: s.slice(last) });
  return out;
}
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
