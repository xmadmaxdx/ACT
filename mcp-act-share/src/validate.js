export function lettersFor(n, section) {
  if (String(section || "").toLowerCase() === "reading" && n % 2 === 0) {
    return ["F", "G", "H", "J"];
  }
  return ["A", "B", "C", "D"];
}

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

function stripLetterPrefix(opt, letters, k) {
  return String(opt).replace(new RegExp(`^${letters[k]}[.):]\\s*`), "");
}

export function normalizeMcq(section, raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Test must be a JSON object with passages + questions.");
  }
  const isReading = section === "reading";
  const passages = raw.passages;
  if (!Array.isArray(passages) || passages.length === 0) {
    throw new Error("Need at least 1 passage in passages.");
  }
  passages.forEach((src, i) => {
    if (!src || typeof src !== "object") throw new Error(`Passage ${i + 1} must be an object.`);
    if (!Array.isArray(src.paras) || src.paras.length === 0) {
      throw new Error(`Passage ${i + 1} needs a non-empty paras array.`);
    }
    src.paras.forEach((pa, j) => {
      if (isReading && typeof pa !== "string") {
        throw new Error(`Passage ${i + 1} para ${j} must be a plain string for reading.`);
      }
      if (!isReading && !Array.isArray(pa)) {
        throw new Error(`Passage ${i + 1} para ${j} must be a span array for english.`);
      }
      if (!isReading && Array.isArray(pa)) {
        pa.forEach((sp, k) => {
          if (!sp || typeof sp !== "object") throw new Error(`Passage ${i + 1} para ${j} span ${k} must be an object.`);
          if (typeof sp.t !== "string") throw new Error(`Passage ${i + 1} para ${j} span ${k} needs a "t" string.`);
          if (sp.u !== undefined && !Number.isInteger(sp.u)) {
            throw new Error(`Passage ${i + 1} para ${j} span ${k}: "u" must be an integer question number.`);
          }
        });
      }
    });
  });
  const byId = new Map(passages.map((src, i) => [src.id || `p${i + 1}`, { src, index: i }]));
  const firstPid = passages[0].id || "p1";
  const questions = raw.questions;
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Need at least 1 question.");
  }
  const seen = new Set();
  questions.forEach((q, i) => {
    if (!q || typeof q !== "object") throw new Error(`Q${i + 1}: must be an object.`);
    const n = q.n ?? i + 1;
    if (seen.has(n)) throw new Error(`Duplicate question number ${n}.`);
    seen.add(n);
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error(`Q${n}: need exactly 4 options.`);
    }
    const ok = lettersFor(n, section);
    if (!ok.includes(q.answer)) {
      throw new Error(`Q${n}: answer must be one of ${ok.join(", ")}.`);
    }
    if (isReading && !q.stem) throw new Error(`Q${n}: reading questions need a stem.`);
    const entry = byId.get(q.p || firstPid);
    if (!entry) throw new Error(`Q${n}: unknown passage id "${q.p}".`);
    (q.refs || []).forEach((r, j) => {
      if (!r || !Number.isInteger(r.para) || r.para < 0 || r.para >= entry.src.paras.length) {
        throw new Error(`Q${n} ref ${j}: bad para index.`);
      }
    });
  });
  const total = questions.length;
  let timeMinutes = Number(raw.timeMinutes);
  if (!timeMinutes || timeMinutes <= 0) {
    timeMinutes = isReading ? 10 * passages.length : Math.round(total * 0.7 * 2) / 2;
  }
  return {
    id: raw.id || (isReading ? "SHARED-READING-1" : "SHARED-ENGLISH-1"),
    title: raw.title || (isReading ? "Shared Reading" : "Shared English"),
    section,
    total,
    timeMinutes,
    figures: raw.figures && typeof raw.figures === "object" ? raw.figures : {},
    passages: passages.map((src, i) => ({
      id: src.id || `p${i + 1}`,
      title: src.title || raw.title || `Passage ${i + 1}`,
      paras: src.paras,
    })),
    questions: questions.map((q, i) => {
      const n = q.n ?? i + 1;
      const ok = lettersFor(n, section);
      return {
        n,
        p: q.p || firstPid,
        tag: q.tag || "Custom",
        stem: q.stem || "",
        short: q.short || q.stem || `Question ${n}`,
        options: q.options.map((opt, k) => stripLetterPrefix(opt, ok, k)),
        answer: q.answer,
        explain: q.explain || "",
        refs: q.refs || [],
        point: q.point,
      };
    }),
  };
}

export function normalizeFind(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Test must be a JSON object with passages + questions.");
  }
  const passages = raw.passages;
  if (!Array.isArray(passages) || passages.length === 0) {
    throw new Error("Need at least 1 passage in passages.");
  }
  passages.forEach((src, i) => {
    if (!src || typeof src !== "object") throw new Error(`Passage ${i + 1} must be an object.`);
    if (!Array.isArray(src.paras) || src.paras.length === 0) {
      throw new Error(`Passage ${i + 1} needs a non-empty paras array.`);
    }
    src.paras.forEach((pa, j) => {
      if (typeof pa !== "string") {
        throw new Error(`Passage ${i + 1} para ${j} must be a plain string for find.`);
      }
    });
  });
  const byId = new Map(passages.map((src, i) => [src.id || `p${i + 1}`, { src, index: i }]));
  const firstPid = passages[0].id || "p1";
  const questions = raw.questions;
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Need at least 1 question.");
  }
  const seen = new Set();
  questions.forEach((q, i) => {
    if (!q || typeof q !== "object") throw new Error(`Q${i + 1}: must be an object.`);
    const n = q.n ?? i + 1;
    if (seen.has(n)) throw new Error(`Duplicate question number ${n}.`);
    seen.add(n);
    if (q.options !== undefined || q.answer !== undefined) {
      throw new Error(`Q${n}: find questions use answers spans, not options/answer.`);
    }
    if (!q.stem) throw new Error(`Q${n}: find questions need a stem.`);
    if (!Array.isArray(q.answers) || q.answers.length === 0) {
      throw new Error(`Q${n}: need at least 1 answers entry.`);
    }
    const entry = byId.get(q.p || firstPid);
    if (!entry) throw new Error(`Q${n}: unknown passage id "${q.p}".`);
    q.answers.forEach((a, j) => {
      if (!a || !Number.isInteger(a.para) || a.para < 0 || a.para >= entry.src.paras.length) {
        throw new Error(`Q${n} answers ${j}: bad para index.`);
      }
      if (typeof a.text !== "string" || a.text.length === 0) {
        throw new Error(`Q${n} answers ${j}: text must be a non-empty string.`);
      }
      if (!containsAnswer(entry.src.paras[a.para], a.text)) {
        throw new Error(`Q${n} answers ${j}: text not found verbatim in para ${a.para}.`);
      }
    });
  });
  const total = questions.length;
  let timeMinutes = Number(raw.timeMinutes);
  if (!timeMinutes || timeMinutes <= 0) {
    timeMinutes = total + 3;
  }
  return {
    id: raw.id || "SHARED-FIND-1",
    title: raw.title || "Shared Finding Set",
    section: "find",
    total,
    timeMinutes,
    figures: {},
    passages: passages.map((src, i) => ({
      id: src.id || `p${i + 1}`,
      title: src.title || raw.title || `Passage ${i + 1}`,
      paras: src.paras,
    })),
    questions: questions.map((q, i) => {
      const n = q.n ?? i + 1;
      return {
        n,
        p: q.p || firstPid,
        tag: q.tag || "Detail",
        stem: q.stem || "",
        short: q.short || q.stem || `Question ${n}`,
        answers: q.answers.map((a) => ({ para: a.para, text: a.text })),
        explain: q.explain || "",
        refs: q.refs || [],
      };
    }),
  };
}

export function normalizeTest(section, raw) {
  if (section === "find") return normalizeFind(raw);
  return normalizeMcq(section, raw);
}
