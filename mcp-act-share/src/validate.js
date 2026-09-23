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

const MATHFIG_KINDS = ["table", "bar", "histogram", "line", "scatter", "pie", "numberline", "grid", "box"];

function validateFigureObject(fig, id) {
  if (!fig || typeof fig !== "object" || Array.isArray(fig)) return "figure must be an object.";
  const kind = fig.kind;
  if (!MATHFIG_KINDS.includes(kind)) return `figure kind must be one of ${MATHFIG_KINDS.join(", ")}.`;
  const fin = (v) => typeof v === "number" && Number.isFinite(v);
  if (fig.title !== undefined && typeof fig.title !== "string") return "title must be a string.";
  switch (kind) {
    case "table":
      if (!Array.isArray(fig.columns) || fig.columns.length === 0) return "columns must be non-empty.";
      if (!Array.isArray(fig.rows) || fig.rows.length === 0) return "rows must be non-empty.";
      for (let i = 0; i < fig.rows.length; i++) {
        if (!Array.isArray(fig.rows[i]) || fig.rows[i].length !== fig.columns.length) {
          return `rows[${i}] must have ${fig.columns.length} cells.`;
        }
      }
      return null;
    case "bar":
      if (!Array.isArray(fig.categories) || fig.categories.length === 0) return "categories must be non-empty.";
      if (!Array.isArray(fig.values) || fig.values.length !== fig.categories.length) return "values must match categories.";
      if (!fig.values.every(fin)) return "values must be finite numbers.";
      return null;
    case "histogram":
      if (!Array.isArray(fig.bins) || fig.bins.length === 0) return "bins must be non-empty.";
      for (let i = 0; i < fig.bins.length; i++) {
        const b = fig.bins[i];
        if (!b || !fin(b.lo) || !fin(b.hi) || !fin(b.count)) return `bins[${i}] needs lo, hi, count.`;
        if (!(b.hi > b.lo)) return `bins[${i}] needs hi above lo.`;
      }
      return null;
    case "line":
      if (!Array.isArray(fig.points) || fig.points.length === 0) return "points must be non-empty.";
      for (let i = 0; i < fig.points.length; i++) {
        if (!fig.points[i] || typeof fig.points[i].x !== "string" || !fin(fig.points[i].y)) {
          return `points[${i}] needs x label and y number.`;
        }
      }
      return null;
    case "scatter":
      if (!Array.isArray(fig.points) || fig.points.length === 0) return "points must be non-empty.";
      for (let i = 0; i < fig.points.length; i++) {
        if (!fig.points[i] || !fin(fig.points[i].x) || !fin(fig.points[i].y)) {
          return `points[${i}] needs x and y numbers.`;
        }
      }
      return null;
    case "pie":
      if (!Array.isArray(fig.slices) || fig.slices.length === 0) return "slices must be non-empty.";
      if (!(fig.slices.reduce((a, s) => a + (s && s.value ? s.value : 0), 0) > 0)) {
        return "slices must sum above 0.";
      }
      return null;
    case "numberline":
      if (!fin(fig.min) || !fin(fig.max) || !(fig.max > fig.min)) return "min/max must span a range.";
      return null;
    case "grid":
      if (!Array.isArray(fig.xRange) || !Array.isArray(fig.yRange)) return "xRange/yRange must be pairs.";
      return null;
    case "box":
      for (const k of ["min", "q1", "median", "q3", "max"]) {
        if (!fin(fig[k])) return `${k} must be a finite number.`;
      }
      if (!(fig.min <= fig.q1 && fig.q1 <= fig.median && fig.median <= fig.q3 && fig.q3 <= fig.max)) {
        return "need min <= q1 <= median <= q3 <= max.";
      }
      return null;
    default:
      return "unknown figure kind.";
  }
}

function checkFigures(figures) {
  if (figures === undefined) return {};
  if (!figures || typeof figures !== "object" || Array.isArray(figures)) {
    throw new Error("figures must be an object mapping ids to SVG strings.");
  }
  for (const [id, svg] of Object.entries(figures)) {
    if (typeof svg === "string") {
      if (svg.indexOf("<svg") < 0) {
        throw new Error(`figures["${id}"] must be a string containing <svg.`);
      }
    } else {
      const err = validateFigureObject({ ...svg, id }, id);
      if (err) throw new Error(`figures["${id}"]: ${err}`);
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

function canonBlock(b) {
  if (b && typeof b === "object" && !Array.isArray(b) && typeof b.type === "string") {
    const t = b.type;
    if (THEORY_KEYS.includes(t)) {
      const text = b.text !== undefined ? b.text : b.content !== undefined ? b.content : b.value;
      if (t === "list") {
        const items = b.list !== undefined ? b.list : b.items !== undefined ? b.items : Array.isArray(text) ? text : undefined;
        return { list: items };
      }
      if (t === "table") {
        return { table: b.table !== undefined ? b.table : { head: b.head, rows: b.rows, caption: b.caption } };
      }
      if (t === "example") {
        return {
          example:
            b.example !== undefined
              ? b.example
              : { title: b.title, problem: b.problem, solution: b.solution },
        };
      }
      if (t === "versus") return { versus: b.versus };
      return { [t]: text };
    }
  }
  return b;
}

function checkBlocks(blocks, where) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new Error(`${where}: blocks must be a non-empty array.`);
  }
  return blocks.map((raw, i) => {
    const b = canonBlock(raw);
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
    return b;
  });
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
    if (q.strategy !== undefined && (typeof q.strategy !== "string" || q.strategy.length === 0)) {
      throw new Error(`Q${n}: strategy must be a non-empty string.`);
    }
    if (q.steps !== undefined) {
      if (!Array.isArray(q.steps) || q.steps.length < 3 || q.steps.length > 4) {
        throw new Error(`Q${n}: steps must be an array of 3 or 4 strings.`);
      }
      q.steps.forEach((s, j) => {
        if (typeof s !== "string" || s.length === 0) {
          throw new Error(`Q${n}: steps[${j}] must be a non-empty string.`);
        }
      });
    }
    if (q.solution !== undefined && (typeof q.solution !== "string" || q.solution.length === 0)) {
      throw new Error(`Q${n}: solution must be a non-empty string.`);
    }
    if (q.figure !== undefined && (typeof q.figure !== "string" || q.figure.length === 0)) {
      throw new Error(`Q${n}: figure must be a figure id string.`);
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
  const figures = checkFigures(raw.figures);
  const figIds = new Set(Object.keys(figures));
  questions.forEach((q, i) => {
    const n = q.n ?? i + 1;
    if (q.figure !== undefined && !figIds.has(q.figure)) {
      throw new Error(`Q${n}: unknown figure id "${q.figure}".`);
    }
  });
  return {
    id: raw.id || "SHARED-MATH-1",
    title: raw.title || "Shared Math",
    section: "math",
    total,
    timeMinutes,
    intro: normalizeTheory(raw.theory !== undefined ? raw.theory : raw.intro),
    theoryBreaks,
    figures,
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
        figure: q.figure !== undefined ? q.figure : undefined,
        strategy: q.strategy !== undefined ? q.strategy : undefined,
        steps: q.steps !== undefined ? q.steps.map((s) => String(s)) : undefined,
        solution: q.solution !== undefined ? q.solution : undefined,
      };
    }),
  };
}
