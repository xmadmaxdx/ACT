// Detail-finding scoring — pure module, no JSX, no DOM.
// Punctuation-blind, tolerant of a slightly long/short pick, strict about
// way-too-long picks and wrong-region picks.

export const FIND_THRESHOLDS = {
  minOverlap: 2,
  maxMissingWords: 6,
  maxExtraWords: 6,
  maxExtraSentences: 2,
};

// Lowercase, punctuation → space, collapse whitespace. Punctuation is
// therefore always optional on both sides.
export function normalizeText(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(s) {
  const n = normalizeText(s);
  return n ? n.split(" ") : [];
}

function countTokens(tokens) {
  const m = new Map();
  for (const t of tokens) m.set(t, (m.get(t) || 0) + 1);
  return m;
}

function overlap(a, b) {
  let o = 0;
  for (const [t, c] of a) {
    if (b.has(t)) o += Math.min(c, b.get(t));
  }
  return o;
}

// Locate a quote inside text: exact match first (case-sensitive, then
// case-insensitive), else the longest consecutive word-run of at least
// 2 words. Mirrors the TestScreen highlighter tolerance.
export function locateSpan(text, quote) {
  const full = String(text);
  const q = String(quote);
  if (!q) return null;
  let at = full.indexOf(q);
  if (at >= 0) return [at, at + q.length];
  const low = full.toLowerCase();
  const lq = q.toLowerCase();
  at = low.indexOf(lq);
  if (at >= 0) return [at, at + q.length];
  const words = q.trim().split(/\s+/);
  if (words.length < 2) return null;
  for (let size = words.length; size >= 2; size--) {
    for (let start = 0; start + size <= words.length; start++) {
      const frag = words.slice(start, start + size).join(" ").toLowerCase();
      const i = low.indexOf(frag);
      if (i >= 0) return [i, i + frag.length];
    }
  }
  return null;
}

export function containsAnswer(text, quote) {
  return locateSpan(text, quote) !== null;
}

// Split into sentences with char offsets. Abbreviations may split early —
// harmless here, since both sides share the same segmentation.
export function sentencesOf(text) {
  const full = String(text);
  const out = [];
  const re = /[^.!?]+[.!?]+["'"\u201d]?/g;
  let m;
  let last = 0;
  while ((m = re.exec(full)) !== null) {
    out.push({ text: m[0], s: m.index, e: m.index + m[0].length });
    last = m.index + m[0].length;
  }
  const rest = full.slice(last);
  if (rest.trim()) out.push({ text: rest, s: last, e: full.length });
  if (out.length === 0 && full.trim()) out.push({ text: full, s: 0, e: full.length });
  return out;
}

function sentIndexes(sents, s, e) {
  const set = new Set();
  sents.forEach((sn, i) => {
    if (sn.s < e && sn.e > s) set.add(i);
  });
  return set;
}

// paras: array of plain strings. answers: [{para, text}].
// picked: {para, s, e, text}. Best answer span wins; every gate must pass.
export function scoreSelection(paras, answers, picked) {
  const fail = (reason, base) => ({ correct: false, recall: 0, precision: 0, reason, ...(base || {}) });
  if (!picked || typeof picked.para !== "number" || !(picked.e > picked.s)) {
    return fail("empty");
  }
  const pickToks = tokenize(picked.text);
  if (pickToks.length === 0) return fail("empty");
  const pickCounts = countTokens(pickToks);

  const cands = [];
  for (const a of answers || []) {
    if (!a || typeof a.para !== "number") continue;
    const paraText = paras[a.para];
    if (typeof paraText !== "string") continue;
    const loc = locateSpan(paraText, a.text);
    if (!loc) continue;
    const expToks = tokenize(paraText.slice(loc[0], loc[1]));
    if (expToks.length === 0) continue;
    const o = overlap(pickCounts, countTokens(expToks));
    cands.push({
      answer: a,
      loc,
      expLen: expToks.length,
      pickLen: pickToks.length,
      overlap: o,
      recall: o / expToks.length,
      precision: o / pickToks.length,
    });
  }
  if (cands.length === 0) return fail("unlocatable");
  cands.sort((x, y) => y.recall - x.recall || y.precision - x.precision);

  const t = FIND_THRESHOLDS;
  let firstReason = "overlap";
  for (const c of cands) {
    const missing = c.expLen - c.overlap;
    const extra = c.pickLen - c.overlap;
    if (c.overlap < t.minOverlap) {
      firstReason = "overlap";
      continue;
    }
    // Sentence family: the pick sits inside the answer's own sentence(s),
    // so a short sub-span is right even when it misses many words.
    let inFamily = false;
    let sets = null;
    if (picked.para === c.answer.para) {
      const paraText = paras[picked.para];
      const sents = sentencesOf(paraText);
      if (sents.length > 0) {
        const s = Math.max(0, picked.s);
        const e = Math.min(paraText.length, picked.e);
        const expSet = sentIndexes(sents, c.loc[0], c.loc[1]);
        const pickSet = sentIndexes(sents, s, e);
        let inter = 0;
        pickSet.forEach((i) => {
          if (expSet.has(i)) inter++;
        });
        sets = { expSet, pickSet };
        inFamily = inter > 0 && pickSet.size > 0 && [...pickSet].every((i) => expSet.has(i));
      }
    }
    if (!inFamily && missing > t.maxMissingWords) {
      firstReason = "missing";
      continue;
    }
    if (extra > t.maxExtraWords) {
      firstReason = "extra";
      continue;
    }
    if (picked.para !== c.answer.para) {
      firstReason = "region";
      continue;
    }
    const paraText = paras[picked.para];
    const sents = sentencesOf(paraText);
    if (sents.length > 0) {
      const { expSet, pickSet } = sets || (() => {
        const s = Math.max(0, picked.s);
        const e = Math.min(paraText.length, picked.e);
        return { expSet: sentIndexes(sents, c.loc[0], c.loc[1]), pickSet: sentIndexes(sents, s, e) };
      })();
      let inter = 0;
      pickSet.forEach((i) => {
        if (expSet.has(i)) inter++;
      });
      if (inter === 0) {
        firstReason = "region";
        continue;
      }
      const extra = [...pickSet].filter((i) => !expSet.has(i));
      if (extra.length > t.maxExtraSentences) {
        firstReason = "sentences";
        continue;
      }
      if (extra.length > 0) {
        const lo = Math.min(...expSet);
        const hi = Math.max(...expSet);
        if (!extra.every((i) => i === lo - 1 || i === hi + 1)) {
          firstReason = "sentences";
          continue;
        }
      }
    }
    return { correct: true, recall: c.recall, precision: c.precision, reason: "match" };
  }
  const b = cands[0];
  return {
    correct: false,
    recall: b.recall,
    precision: b.precision,
    reason: firstReason,
  };
}
