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

function checkFigures(figures) {
  if (figures === undefined) return {};
  if (!figures || typeof figures !== "object" || Array.isArray(figures)) {
    throw new Error("figures must be an object mapping ids to SVG strings.");
  }
  for (const [id, svg] of Object.entries(figures)) {
    if (typeof svg !== "string" || svg.indexOf("<svg") < 0) {
      throw new Error(`figures["${id}"] must be a string containing <svg.`);
    }
  }
  return figures;
}

function checkFigRefs(passages, figures) {
  passages.forEach((src, i) => {
    (src.paras || []).forEach((pa) => {
      if (!Array.isArray(pa)) return;
      pa.forEach((sp) => {
        if (sp && typeof sp === "object" && sp.fig !== undefined && !(figures && figures[sp.fig] !== undefined)) {
          throw new Error(`Passage ${i + 1}: fig "${sp.fig}" has no matching entry in figures.`);
        }
      });
    });
  });
}

function stripLetterPrefix(opt, letters, k) {
  return String(opt).replace(new RegExp(`^${letters[k]}[.):]\\s*`), "");
}

function normalizeOption(opt, letters, k, n) {
  if (opt && typeof opt === "object" && !Array.isArray(opt)) {
    const out = { t: opt.t === undefined ? "" : stripLetterPrefix(String(opt.t), letters, k) };
    if (opt.svg !== undefined) {
      if (typeof opt.svg !== "string" || opt.svg.indexOf("<svg") < 0) {
        throw new Error(`Q${n}: option ${k + 1} svg must be a string containing <svg.`);
      }
      out.svg = opt.svg;
    }
    if (!out.t && out.svg === undefined) {
      throw new Error(`Q${n}: option ${k + 1} needs t text or svg.`);
    }
    return out;
  }
  return stripLetterPrefix(opt, letters, k);
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
          if (sp.svg !== undefined) {
            if (typeof sp.svg !== "string" || sp.svg.indexOf("<svg") < 0) {
              throw new Error(`Passage ${i + 1} para ${j} span ${k}: "svg" must be a string containing <svg.`);
            }
            return;
          }
          if (sp.fig !== undefined) {
            if (typeof sp.fig !== "string" || sp.fig.length === 0) {
              throw new Error(`Passage ${i + 1} para ${j} span ${k}: "fig" must be a non-empty id.`);
            }
            return;
          }
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
  const figures = checkFigures(raw.figures);
  if (!isReading) checkFigRefs(passages, figures);
  return {
    id: raw.id || (isReading ? "SHARED-READING-1" : "SHARED-ENGLISH-1"),
    title: raw.title || (isReading ? "Shared Reading" : "Shared English"),
    section,
    total,
    timeMinutes,
    figures,
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
        options: q.options.map((opt, k) => normalizeOption(opt, ok, k, n)),
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
  if (section === "math") return normalizeMath(raw);
  return normalizeMcq(section, raw);
}

const THEORY_KEYS = ["h", "math", "list", "p", "formula", "table", "example", "tip", "warn", "note", "def", "versus"];

function checkBlocks(blocks, where) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new Error(`${where}: blocks must be a non-empty array.`);
  }
  blocks.forEach((b, i) => {
    if (!b || typeof b !== "object" || Array.isArray(b)) {
      throw new Error(`${where} block ${i}: must be an object.`);
    }
    if (!THEORY_KEYS.some((k) => b[k] !== undefined)) {
      throw new Error(`${where} block ${i}: needs one of ${THEORY_KEYS.join(", ")}.`);
    }
    if (b.table !== undefined) {
      if (!b.table || typeof b.table !== "object" || !Array.isArray(b.table.rows) || b.table.rows.length === 0) {
        throw new Error(`${where} block ${i}: table needs a non-empty rows array.`);
      }
      if (b.table.head !== undefined && !Array.isArray(b.table.head)) {
        throw new Error(`${where} block ${i}: table head must be an array.`);
      }
    }
    if (b.example !== undefined) {
      if (!b.example || typeof b.example !== "object" || typeof b.example.problem !== "string") {
        throw new Error(`${where} block ${i}: example needs a problem string.`);
      }
    }
    if (b.versus !== undefined) {
      if (!Array.isArray(b.versus) || b.versus.length < 2 || b.versus.length > 3) {
        throw new Error(`${where} block ${i}: versus needs 2 or 3 cells.`);
      }
      b.versus.forEach((side, k) => {
        if (!side || typeof side !== "object") {
          throw new Error(`${where} block ${i} cell ${k}: must be an object.`);
        }
        if (side.shape !== undefined && (typeof side.shape !== "string" || !/^[a-z0-9-]+$/.test(side.shape))) {
          throw new Error(`${where} block ${i} cell ${k}: shape must be a preset name like triangle-right.`);
        }
        if (side.svg !== undefined && (typeof side.svg !== "string" || side.svg.indexOf("<svg") < 0)) {
          throw new Error(`${where} block ${i} cell ${k}: svg must be a string containing <svg.`);
        }
        if (side.title !== undefined && typeof side.title !== "string") {
          throw new Error(`${where} block ${i} cell ${k}: title must be a string.`);
        }
        if (side.text !== undefined && typeof side.text !== "string") {
          throw new Error(`${where} block ${i} cell ${k}: text must be a string.`);
        }
      });
    }
  });
  return blocks;
}

function normalizeTheory(theory) {
  if (theory === null || theory === undefined) return null;
  if (typeof theory !== "object" || Array.isArray(theory)) {
    throw new Error("theory must be an object with blocks or slides.");
  }
  if (Array.isArray(theory.slides)) {
    if (theory.slides.length === 0) throw new Error("theory.slides must be non-empty.");
    return {
      slides: theory.slides.map((s, i) => ({
        heading: s.heading || "",
        blocks: checkBlocks(s.blocks, `theory slide ${i + 1}`),
      })),
    };
  }
  return {
    heading: theory.heading || "",
    blocks: checkBlocks(theory.blocks, "theory"),
  };
}

export function normalizeMath(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Test must be a JSON object with questions.");
  }
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
    if (typeof q.statement !== "string" || q.statement.length === 0) {
      throw new Error(`Q${n}: math questions need a statement string.`);
    }
    if (q.svg !== undefined && (typeof q.svg !== "string" || q.svg.indexOf("<svg") < 0)) {
      throw new Error(`Q${n}: svg must be a string containing <svg.`);
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error(`Q${n}: need exactly 4 options.`);
    }
    if (!["A", "B", "C", "D"].includes(q.answer)) {
      throw new Error(`Q${n}: answer must be one of A, B, C, D.`);
    }
  });
  const total = questions.length;
  let timeMinutes = Number(raw.timeMinutes);
  if (!timeMinutes || timeMinutes <= 0) timeMinutes = 10;
  const breaks = Array.isArray(raw.theoryBreaks) ? raw.theoryBreaks : [];
  const theoryBreaks = breaks.map((b, i) => {
    if (!b || typeof b !== "object") throw new Error(`theoryBreak ${i + 1}: must be an object.`);
    if (!Number.isInteger(b.after) || b.after < 1 || b.after > total) {
      throw new Error(`theoryBreak ${i + 1}: after must be a question number 1-${total}.`);
    }
    return {
      after: b.after,
      heading: b.heading || "",
      blocks: checkBlocks(b.blocks, `theoryBreak ${i + 1}`),
    };
  });
  return {
    id: raw.id || "SHARED-MATH-1",
    title: raw.title || "Shared Math",
    section: "math",
    total,
    timeMinutes,
    intro: normalizeTheory(raw.theory !== undefined ? raw.theory : raw.intro),
    theoryBreaks,
    figures: checkFigures(raw.figures),
    passages: questions.map((q, i) => {
      const n = q.n ?? i + 1;
      const spans = [{ t: q.statement }];
      if (q.svg !== undefined) spans.push({ svg: q.svg });
      return { id: `q${n}`, title: `Problem ${n}`, paras: [spans] };
    }),
    questions: questions.map((q, i) => {
      const n = q.n ?? i + 1;
      return {
        n,
        p: `q${n}`,
        tag: q.tag || "Custom",
        stem: "",
        stemSide: "left",
        short: q.short || `Problem ${n}`,
        options: q.options.map((opt, k) => normalizeOption(opt, ["A", "B", "C", "D"], k, n)),
        answer: q.answer,
        explain: q.explain || "",
        svg: q.svg !== undefined ? q.svg : undefined,
      };
    }),
  };
}
