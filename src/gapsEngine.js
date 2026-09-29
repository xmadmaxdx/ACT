/* DET-style gap engine (pure, no React). The AI only supplies raw
   sentences/passages — every gap decision below is ours.
   Gap law (mirrors official Read and Complete / Fill in the Blanks):
   - partial-word gaps: leading letters shown, trailing letters boxed
   - first + last sentences of a passage are never gapped
   - gaps never adjacent, never proper nouns
   - 2-3 easy function-word gaps per passage (in/of/for/to/the …), rest
     content words (length 4+, letters only, no apostrophes) */

export const FUNCTION_EASIES = [
  "in", "of", "for", "to", "the", "and", "is", "are", "was", "on",
  "at", "as", "it", "an", "or", "by", "be", "we", "so", "up",
  "but", "not", "all", "off", "out",
];

export const SINGLE_TIME_SEC = 20;
export const PASSAGE_TIME_SEC = 180;
export const PASSAGE_GAP_COUNT = 10;
export const PASSAGE_EASY_COUNT = 3;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WORD_RE = /[A-Za-z]+(?:'[a-z]+)?/gi;
const PROPER_RE = /^[A-Z]/;
const LETTERS_ONLY_RE = /^[A-Za-z]+$/;

/* Split text into word/separator tokens with char offsets. Join of every
   token text === input (lossless, covered by verify-gaps). */
export function tokenize(text) {
  const src = String(text || "");
  const out = [];
  let last = 0;
  WORD_RE.lastIndex = 0;
  let m;
  while ((m = WORD_RE.exec(src)) !== null) {
    if (m.index > last) out.push({ t: src.slice(last, m.index), word: false });
    out.push({ t: m[0], word: true, start: m.index, end: m.index + m[0].length });
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push({ t: src.slice(last), word: false });
  return out;
}

export function splitSentences(text) {
  return String(text || "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Shown letters: 1 for tiny words, ceil(half) otherwise ("mood" -> "mo"). */
export function shownCount(word) {
  const len = word.length;
  if (len <= 3) return 1;
  return Math.ceil(len / 2);
}

function isProper(word, atSentenceStart) {
  return !atSentenceStart && PROPER_RE.test(word);
}

/* Word indexes eligible inside one tokenized sentence: skip first/last
   token-word, skip proper nouns, skip apostrophe words. Returns token idx. */
function eligibleInSentence(tokens, opts) {
  const wordIdx = [];
  tokens.forEach((tk, i) => {
    if (tk.word) wordIdx.push(i);
  });
  const out = [];
  wordIdx.forEach((ti, k) => {
    if (k === 0 || k === wordIdx.length - 1) return;
    const w = tokens[ti].t;
    if (!LETTERS_ONLY_RE.test(w)) return;
    if (isProper(w, false)) return;
    if (w.length < (opts.minLen || 4)) return;
    out.push(ti);
  });
  return out;
}

function makeGap(word, start) {
  const shown = word.slice(0, shownCount(word));
  return { answer: word, shown, boxes: word.length - shown.length, start };
}

/* Core picker. sentences: string[]. Returns gap descriptors ordered by
   appearance: { sent, tokIdx, word }. Throws when text cannot supply quota. */
function pickGaps(sentences, quota, easyQuota, rng) {
  const toks = sentences.map((s) => tokenize(s));
  const mid = toks.map((_, i) => i).filter((i) => i > 0 && i < toks.length - 1);
  if (sentences.length === 1 && mid.length === 0) {
    // Single-sentence mode: the lone sentence is fully eligible.
    mid.push(0);
  }
  if (mid.length === 0) throw new Error("gaps: need at least 3 sentences for a passage.");
  const picked = [];
  const used = new Set();
  const take = (ti, si, word) => {
    const key = `${si}:${ti}`;
    if (used.has(key)) return false;
    for (const p of picked) {
      // Token indexes: neighboring words differ by 2 (word, sep, word), so
      // < 4 guarantees a full untouched word between any two gaps.
      if (p.si === si && Math.abs(p.ti - ti) < 4) return false;
    }
    used.add(key);
    picked.push({ si, ti, word });
    return true;
  };
  // Content words first, round-robin across shuffled middle sentences.
  const order = shuffle(mid, rng);
  const sweepContent = (target) => {
    let guard = 0;
    while (picked.length < target && guard++ < 5000) {
      let moved = false;
      for (const si of order) {
        if (picked.length >= target) break;
        const cands = shuffle(eligibleInSentence(toks[si], { minLen: 4 }), rng);
        for (const ti of cands) {
          const w = toks[si][ti].t;
          if (FUNCTION_EASIES.includes(w.toLowerCase())) continue;
          if (take(ti, si, w)) {
            moved = true;
            break;
          }
        }
      }
      if (!moved) break;
    }
  };
  // Easy function words first: their positions are scarce, so they claim
  // slots before dense content packing blocks them. Then content fills all
  // remaining quota (covering any easy shortfall on sparse texts).
  let easyLeft = easyQuota;
  let guard = 0;
  while (easyLeft > 0 && picked.length < quota && guard++ < 5000) {
    let moved = false;
    for (const si of shuffle(mid, rng)) {
      if (easyLeft === 0 || picked.length >= quota) break;
      const cands = shuffle(eligibleInSentence(toks[si], { minLen: 2 }), rng);
      for (const ti of cands) {
        const w = toks[si][ti].t;
        if (!FUNCTION_EASIES.includes(w.toLowerCase())) continue;
        if (take(ti, si, w)) {
          easyLeft -= 1;
          moved = true;
          break;
        }
      }
    }
    if (!moved) break;
  }
  // Content fills everything remaining (covers easy shortfall on sparse texts).
  sweepContent(quota);
  if (picked.length < quota) {
    throw new Error(`gaps: text supplied ${picked.length} gaps, need ${quota}.`);
  }
  picked.sort((a, b) => (a.si - b.si) || (a.ti - b.ti));
  return { toks, picked };
}

/* Build renderer input: segments mix {t} text and {gap} indexes.
   Gap objects carry start offsets so saved tests rebuild exactly. */
function build(toks, picked, base) {
  const gaps = [];
  const byKey = new Map();
  picked.forEach((p) => {
    const tk = toks[p.si][p.ti];
    const word = tk.t;
    const g = { id: gaps.length, ...makeGap(word, base[p.si] + tk.start) };
    gaps.push(g);
    byKey.set(`${p.si}:${p.ti}`, g.id);
  });
  return { gaps, byKey };
}

function sentenceBaseOffsets(sentences) {
  const base = [];
  let at = 0;
  sentences.forEach((s, i) => {
    base.push(at);
    at += s.length + (i < sentences.length - 1 ? 1 : 0);
  });
  return base;
}

export function buildGaps(sentences, quota, easyQuota, rng) {
  const rand = rng || Math.random;
  const { toks, picked } = pickGaps(sentences, quota, easyQuota, rand);
  const { gaps, byKey } = build(toks, picked, sentenceBaseOffsets(sentences));
  const segments = [];
  toks.forEach((tokens, si) => {
    tokens.forEach((tk, ti) => {
      if (!tk.word) {
        segments.push({ t: tk.t });
        return;
      }
      const key = `${si}:${ti}`;
      if (byKey.has(key)) segments.push({ gap: byKey.get(key) });
      else segments.push({ t: tk.t });
    });
    if (si < toks.length - 1) segments.push({ t: " " });
  });
  return { gaps, segments };
}

/* Single-sentence drill: exactly 1 content gap. */
export function buildSingleGap(sentence, rng) {
  const rand = rng || Math.random;
  const toks = [tokenize(sentence)];
  const cands = eligibleInSentence(toks[0], { minLen: 4 }).filter(
    (ti) => !FUNCTION_EASIES.includes(toks[0][ti].t.toLowerCase())
  );
  const pool = cands.length > 0 ? cands : eligibleInSentence(toks[0], { minLen: 3 });
  if (pool.length === 0) throw new Error("gaps: sentence too short for a gap.");
  const ti = pool[Math.floor(rand() * pool.length)];
  const tk = toks[0][ti];
  const word = tk.t;
  const gaps = [{ id: 0, ...makeGap(word, tk.start) }];
  const segments = [];
  toks[0].forEach((tk, i) => {
    if (!tk.word) {
      segments.push({ t: tk.t });
      return;
    }
    segments.push(i === ti ? { gap: 0 } : { t: tk.t });
  });
  return { gaps, segments };
}

/* Rebuild renderer input from saved {text, gaps} (share links, replay).
   Validates offsets: in-bounds, non-overlapping, answer matches slice,
   shown is a prefix. Throws with a reason otherwise. */
export function segmentsFromOffsets(text, gaps) {
  const src = String(text || "");
  const list = Array.isArray(gaps) ? gaps.slice() : [];
  if (list.length === 0) throw new Error("gaps: need at least 1 gap.");
  list.forEach((g, k) => {
    if (!g || typeof g.answer !== "string" || g.answer.length === 0) {
      throw new Error(`gaps: gap ${k} needs a non-empty answer.`);
    }
    if (!Number.isInteger(g.start) || g.start < 0 || g.start + g.answer.length > src.length) {
      throw new Error(`gaps: gap ${k} offset out of bounds.`);
    }
    if (src.slice(g.start, g.start + g.answer.length) !== g.answer) {
      throw new Error(`gaps: gap ${k} answer does not match text at offset.`);
    }
    if (typeof g.shown !== "string" || !g.answer.startsWith(g.shown) || g.shown.length === 0) {
      throw new Error(`gaps: gap ${k} shown must be a non-empty prefix.`);
    }
  });
  const sorted = list
    .map((g, k) => ({ ...g, id: k }))
    .sort((a, b) => a.start - b.start);
  for (let k = 1; k < sorted.length; k++) {
    if (sorted[k].start < sorted[k - 1].start + sorted[k - 1].answer.length) {
      throw new Error("gaps: offsets overlap.");
    }
  }
  const segments = [];
  let at = 0;
  sorted.forEach((g) => {
    if (g.start > at) segments.push({ t: src.slice(at, g.start) });
    segments.push({ gap: g.id });
    at = g.start + g.answer.length;
  });
  if (at < src.length) segments.push({ t: src.slice(at) });
  return { gaps: sorted, segments };
}

/* Score: per-word binary, case-insensitive leniency (documented clone
   choice — official scoring is exact-letter). */
export function scoreGaps(gaps, typed) {
  const per = gaps.map((g) => {
    const attempt = String((typed && typed[g.id]) || "").trim().toLowerCase();
    return attempt.length > 0 && g.shown.toLowerCase() + attempt === g.answer.toLowerCase();
  });
  const correct = per.filter(Boolean).length;
  return { correct, total: gaps.length, per };
}
