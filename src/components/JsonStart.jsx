import { useState } from "react";
import { lettersFor } from "../scoring.js";
import { tolerantParse, fixSummary } from "../tolerantJson.js";
import { containsAnswer } from "../detailScore.js";
import readingPrompt from "../data/reading-prompt.md?raw";
import englishPrompt from "../data/english-prompt.md?raw";
import findPrompt from "../data/find-prompt.md?raw";

const SAMPLE_READING = `{
  "id": "JSON-READING-1",
  "title": "The Night Shift",
  "section": "reading",
  "total": 3,
  "timeMinutes": 10,
  "passages": [
    {
      "id": "p1",
      "title": "The Night Shift",
      "paras": [
        "Mara had worked the night shift at the observatory for eleven years, and she still loved the hour after midnight best. The dome smelled faintly of oil and cold air.",
        "On the night of the storm, the power failed at half past one. Mara lit the emergency lantern and kept watching the sky through the small round window."
      ]
    }
  ],
  "questions": [
    {
      "n": 1,
      "p": "p1",
      "tag": "Inference",
      "stem": "It can reasonably be inferred that Mara felt about the night shift:",
      "options": ["bored and restless.", "tired but dutiful.", "fond and attentive.", "lonely and afraid."],
      "answer": "C",
      "explain": "She still loved the hour after midnight and kept watching even during the outage.",
      "refs": [{ "para": 0, "text": "she still loved the hour after midnight" }]
    },
    {
      "n": 2,
      "p": "p1",
      "tag": "Detail",
      "stem": "According to the passage, when did the power fail?",
      "options": [
        "At midnight exactly.",
        "At half past one.",
        "During the morning shift.",
        "It never failed."
      ],
      "answer": "G",
      "explain": "The passage states the power failed at half past one.",
      "refs": [{ "para": 1, "text": "power failed at half past one" }]
    },
    {
      "n": 3,
      "p": "p1",
      "tag": "Vocabulary",
      "stem": "As used in the passage, the word \\"emergency\\" most nearly means:",
      "options": ["urgent backup.", "medical kit.", "fire alarm.", "exit door."],
      "answer": "A",
      "explain": "The lantern is backup light for the outage.",
      "refs": [{ "para": 1, "text": "emergency lantern" }]
    }
  ]
}`;

const SAMPLE_ENGLISH = `{
  "id": "JSON-ENGLISH-1",
  "title": "Morning Trains",
  "section": "english",
  "total": 2,
  "timeMinutes": 7,
  "passages": [
    {
      "id": "p1",
      "title": "Morning Trains",
      "paras": [
        [
          { "t": "The 6:10 train " },
          { "u": 1, "t": "leave" },
          { "t": " right on time every morning, even in January snow." }
        ],
        [
          { "t": "Commuters, half asleep, " },
          { "u": 2, "t": "clutches" },
          { "t": " their paper cups like lifelines." }
        ]
      ]
    }
  ],
  "questions": [
    {
      "n": 1,
      "p": "p1",
      "tag": "Subject-Verb Agreement",
      "stem": "Which choice makes the sentence most grammatically acceptable?",
      "options": ["No Change", "leaves", "leaving", "have left"],
      "answer": "B",
      "explain": "Singular subject \\"train\\" needs \\"leaves\\"."
    },
    {
      "n": 2,
      "p": "p1",
      "tag": "Pronoun Agreement",
      "stem": "Which choice makes the sentence most grammatically acceptable?",
      "options": ["No Change", "clutch", "clutched", "will clutch"],
      "answer": "B",
      "explain": "Plural subject \\"Commuters\\" needs \\"clutch\\"."
    }
  ]
}`;

const SAMPLE_FIND = `{
  "id": "JSON-FIND-1",
  "title": "The Night Shift",
  "section": "find",
  "total": 2,
  "timeMinutes": 4,
  "passages": [
    {
      "id": "p1",
      "title": "The Night Shift",
      "paras": [
        "Mara had worked the night shift at the observatory for eleven years, and she still loved the hour after midnight best. The dome smelled faintly of oil and cold air.",
        "On the night of the storm, the power failed at half past one. Mara lit the emergency lantern and kept watching the sky through the small round window."
      ]
    }
  ],
  "questions": [
    {
      "n": 1,
      "p": "p1",
      "tag": "Explicit detail",
      "stem": "Select the words that tell when the power failed.",
      "answers": [{ "para": 1, "text": "the power failed at half past one" }],
      "explain": "The outage time is stated directly: the power failed at half past one on the storm night."
    },
    {
      "n": 2,
      "p": "p1",
      "tag": "Inference support",
      "stem": "Select the sentence that shows Mara stayed dedicated to her watch.",
      "answers": [{ "para": 1, "text": "Mara lit the emergency lantern and kept watching the sky through the small round window." }],
      "explain": "Lighting the lantern and keeping watch through the outage proves dedication beyond duty."
    }
  ]
}`;

function normalize(section, raw, expectedCount) {
  const want = expectedCount && expectedCount > 0 ? expectedCount : 1;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Top level must be a JSON object.");
  }
  const passages = raw.passages;
  if (!Array.isArray(passages) || passages.length !== want) {
    throw new Error(
      `Must contain exactly ${want} passage${want === 1 ? "" : "s"} for the selected passage count.`
    );
  }
  const isReading = section === "reading";
  passages.forEach((src, i) => {
    if (!Array.isArray(src.paras) || src.paras.length === 0) {
      throw new Error(`Passage ${i + 1} needs a non-empty paras array.`);
    }
    src.paras.forEach((pa, j) => {
      if (isReading && typeof pa !== "string") {
        throw new Error(`Passage ${i + 1} para ${j} must be a plain string for reading.`);
      }
      if (!isReading && !Array.isArray(pa)) {
        throw new Error(
          `Passage ${i + 1} para ${j} must be a span array for english (same as practice files).`
        );
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
      if (!Number.isInteger(r.para) || r.para < 0 || r.para >= entry.src.paras.length) {
        throw new Error(`Q${n} ref ${j}: bad para index.`);
      }
      if (typeof r.text !== "string" || r.text.length === 0) return;
    });
  });
  const total = questions.length;
  let timeMinutes = Number(raw.timeMinutes);
  if (!timeMinutes || timeMinutes <= 0) {
    timeMinutes = isReading ? 10 * passages.length : Math.round(total * 0.7 * 2) / 2;
  }
  return {
    id: raw.id || (isReading ? "JSON-READING-1" : "JSON-ENGLISH-1"),
    title: raw.title || (isReading ? "Custom Reading" : "Custom English"),
    section,
    total,
    timeMinutes,
    figures: raw.figures || {},
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
        options: q.options.map((opt, k) =>
          String(opt).replace(new RegExp(`^${ok[k]}[.):]\\s*`), "")
        ),
        answer: q.answer,
        explain: q.explain || "",
        refs: q.refs || [],
        point: q.point,
      };
    }),
  };
}

// Detail-finding sets: plain-string paras, stems, and verbatim answer
// spans. No options/answer keys — those belong to MCQ sections.
function normalizeFind(raw, expectedCount) {
  const want = expectedCount && expectedCount > 0 ? expectedCount : 1;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Top level must be a JSON object.");
  }
  const passages = raw.passages;
  if (!Array.isArray(passages) || passages.length !== want) {
    throw new Error(
      `Must contain exactly ${want} passage${want === 1 ? "" : "s"} for the selected passage count.`
    );
  }
  passages.forEach((src, i) => {
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
      if (!Number.isInteger(a.para) || a.para < 0 || a.para >= entry.src.paras.length) {
        throw new Error(`Q${n} answers ${j}: bad para index.`);
      }
      if (typeof a.text !== "string" || a.text.length === 0) {
        throw new Error(`Q${n} answers ${j}: text must be a non-empty string.`);
      }
      if (!containsAnswer(entry.src.paras[a.para], a.text)) {
        throw new Error(`Q${n} answers ${j}: text not found verbatim in para ${a.para}.`);
      }
    });
    (q.refs || []).forEach((r, j) => {
      if (!Number.isInteger(r.para) || r.para < 0 || r.para >= entry.src.paras.length) {
        throw new Error(`Q${n} ref ${j}: bad para index.`);
      }
      if (typeof r.text !== "string" || r.text.length === 0) return;
    });
  });
  const total = questions.length;
  let timeMinutes = Number(raw.timeMinutes);
  if (!timeMinutes || timeMinutes <= 0) {
    timeMinutes = total + 3;
  }
  return {
    id: raw.id || "JSON-FIND-1",
    title: raw.title || "Custom Finding Set",
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

function mergeTests(section, tests) {
  if (tests.length === 1) return tests[0];
  let qn = 0;
  const passages = [];
  const questions = [];
  tests.forEach((t, si) => {
    const pidMap = {};
    t.passages.forEach((p, pi) => {
      const nid = `s${si + 1}p${pi + 1}`;
      pidMap[p.id] = nid;
      passages.push({ ...p, id: nid });
    });
    t.questions.forEach((q) => {
      qn += 1;
      const ok = lettersFor(qn, section);
      const idx = q.answer === undefined ? -1 : lettersFor(q.n, section).indexOf(q.answer);
      questions.push({
        ...q,
        n: qn,
        p: pidMap[q.p] || Object.values(pidMap)[0],
        short: /^Question \d+$/.test(q.short || "") ? `Question ${qn}` : q.short,
        answer: idx >= 0 ? ok[idx] : q.answer,
      });
    });
  });
  const total = questions.length;
  const summed = tests.reduce((a, t) => a + (Number(t.timeMinutes) || 0), 0);
  return {
    id: tests[0].id,
    title: `${tests[0].title} (+${tests.length - 1} more)`,
    section,
    total,
    timeMinutes:
      summed > 0 ? summed : section === "reading" ? 10 * passages.length : (Math.round(total * 0.7 * 2) / 2),
    figures: Object.assign({}, ...tests.map((t) => t.figures || {})),
    passages,
    questions,
  };
}

export default function JsonStart({ variant, defaultSection, onStart, onClose }) {
  const [tab, setTab] = useState(defaultSection || "reading");
  const [count, setCount] = useState(1);
  // One independent textarea per slot: switching numbers never leaks text.
  const [texts, setTexts] = useState([""]);
  const text = texts[count - 1] || "";
  const setText = (v) =>
    setTexts((prev) => {
      const next = prev.slice();
      while (next.length < count) next.push("");
      next[count - 1] = v;
      return next;
    });
  const maxCount = tab === "english" ? 6 : 4;
  const filledCount = texts.filter((t) => t && t.trim()).length;
  const [mode, setMode] = useState("untimed");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [fixNote, setFixNote] = useState("");

  const copyPrompt = async () => {
    const prompt = tab === "reading" ? readingPrompt : tab === "english" ? englishPrompt : findPrompt;
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const start = () => {
    const filled = texts
      .map((t, i) => ({ text: t, slot: i + 1 }))
      .filter((x) => x.text && x.text.trim());
    if (!filled.length) {
      setFixNote("");
      setError("Paste at least 1 set.");
      return;
    }
    let raws;
    try {
      const notes = [];
      raws = filled.map(({ text: t, slot }) => {
        try {
          const parsed = tolerantParse(t);
          const note = fixSummary(parsed.fixes);
          if (note) notes.push(`Slot ${slot}: ${note}`);
          return { raw: parsed.value, slot };
        } catch (e) {
          throw new Error(`Slot ${slot}: ${e.message}`);
        }
      });
      setFixNote(notes.join(" "));
    } catch (e) {
      setFixNote("");
      setError(e.message);
      return;
    }
    try {
      const singles = raws.map(({ raw, slot }) => {
        const n = Array.isArray(raw.passages) ? raw.passages.length : 0;
        if (!n) throw new Error(`Slot ${slot}: need at least 1 passage.`);
        try {
          return tab === "find" ? normalizeFind(raw, n) : normalize(tab, raw, n);
        } catch (e) {
          throw new Error(`Slot ${slot}: ${e.message}`);
        }
      });
      const test = mergeTests(tab, singles);
      setError("");
      onStart(test, mode);
      if (variant === "modal") onClose();
      else setTexts([""]);
    } catch (e) {
      setError(e.message);
    }
  };

  const body = (
    <div className="jsonstart">
      <div className="tabs rise d3" role="tablist" aria-label="JSON section">
        {["reading", "english", "find"].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            type="button"
            className={tab === t ? "tab active" : "tab"}
            onClick={() => {
              setTab(t);
              setCount(1);
              setTexts([""]);
              setError("");
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>
      <p className="muted-text">
        {tab === "reading"
          ? `Slot ${count} of ${maxCount} — paste one reading set here (9 questions · 10 min). `
          : tab === "english"
            ? `Slot ${count} of ${maxCount} — paste one english set here (5 or 10 questions). `
            : `Slot ${count} of ${maxCount} — paste one finding set here (5 questions · 8 min). `}
        Each number keeps its own text. Filled slots ({filledCount}) merge on start and totals add up.
        {tab === "find"
          ? "Finding paras are plain strings; each question carries verbatim answers spans — no options."
          : "Reading paras are plain strings + exact-quote refs; English paras use span arrays like the practice files."}
      </p>
      <div className="jsonstart-row">
        <div className="mode-toggle" role="group" aria-label="Passage count">
          {Array.from({ length: maxCount }, (_, i) => i + 1).map((c) => (
            <button
              key={c}
              type="button"
              className={count === c ? "tab active small" : "tab small"}
              onClick={() => {
                setCount(c);
                setError("");
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="jsonstart-row">
        <button
          type="button"
          className="footer-link"
          onClick={() => {
            setText(tab === "reading" ? SAMPLE_READING : tab === "english" ? SAMPLE_ENGLISH : SAMPLE_FIND);
            setError("");
          }}
        >
          LOAD SAMPLE
        </button>
        <button type="button" className="footer-link" onClick={copyPrompt}>
          {copied ? "PROMPT COPIED ✓" : "COPY PROMPT"}
        </button>
        <div className="mode-toggle" role="group" aria-label="Timing">
          {["untimed", "timed"].map((m) => (
            <button
              key={m}
              type="button"
              className={mode === m ? "tab active small" : "tab small"}
              onClick={() => setMode(m)}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <textarea
        className="jsonstart-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'{ "title": "...", "section": "...", "passages": [...], "questions": [...] }'}
        rows={10}
        spellCheck={false}
      />
      {error && <p className="jsonstart-error">{error}</p>}
      {fixNote && !error && <p className="jsonstart-note">{fixNote}</p>}
      <button type="button" className="btn-primary" onClick={start} disabled={!filledCount}>
        START EXAM
      </button>
    </div>
  );

  if (variant === "modal") {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Start from JSON">
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
          <h3 className="modal-title">Add a section from JSON</h3>
          {body}
        </div>
      </div>
    );
  }

  return (
    <section className="rise d4">
      <hr className="divider" />
      <h2 className="section-title">Start from JSON</h2>
      {body}
    </section>
  );
}
