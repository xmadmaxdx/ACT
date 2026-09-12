import { useState } from "react";
import { lettersFor } from "../scoring.js";
import { tolerantParse, fixSummary } from "../tolerantJson.js";
import readingPrompt from "../data/reading-prompt.md?raw";
import englishPrompt from "../data/english-prompt.md?raw";

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

function normalize(section, raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Top level must be a JSON object.");
  }
  const passages = raw.passages;
  if (!Array.isArray(passages) || passages.length !== 1) {
    throw new Error("Must contain exactly 1 passage.");
  }
  const src = passages[0];
  if (!Array.isArray(src.paras) || src.paras.length === 0) {
    throw new Error("Passage needs a non-empty paras array.");
  }
  const isReading = section === "reading";
  src.paras.forEach((pa, i) => {
    if (isReading && typeof pa !== "string") {
      throw new Error(`Para ${i} must be a plain string for reading.`);
    }
    if (!isReading && !Array.isArray(pa)) {
      throw new Error(`Para ${i} must be a span array for english (same as practice files).`);
    }
  });
  const questions = raw.questions;
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Need at least 1 question.");
  }
  const pid = src.id || "p1";
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
    (q.refs || []).forEach((r, j) => {
      if (!Number.isInteger(r.para) || r.para < 0 || r.para >= src.paras.length) {
        throw new Error(`Q${n} ref ${j}: bad para index.`);
      }
      if (!r.text) throw new Error(`Q${n} ref ${j}: needs exact quote text.`);
      if (isReading && typeof src.paras[r.para] === "string" && !src.paras[r.para].includes(r.text)) {
        throw new Error(`Q${n} ref ${j}: quote not found in para ${r.para}.`);
      }
    });
  });
  const total = questions.length;
  let timeMinutes = Number(raw.timeMinutes);
  if (!timeMinutes || timeMinutes <= 0) {
    timeMinutes = isReading ? 10 : total >= 10 ? 7 : 3.5;
  }
  return {
    id: raw.id || (isReading ? "JSON-READING-1" : "JSON-ENGLISH-1"),
    title: raw.title || (isReading ? "Custom Reading" : "Custom English"),
    section,
    total,
    timeMinutes,
    figures: raw.figures || {},
    passages: [
      {
        id: pid,
        title: src.title || raw.title || "Passage 1",
        paras: src.paras,
      },
    ],
    questions: questions.map((q, i) => ({
      n: q.n ?? i + 1,
      p: q.p || pid,
      tag: q.tag || "Custom",
      stem: q.stem || "",
      short: q.short || q.stem || `Question ${q.n ?? i + 1}`,
      options: q.options,
      answer: q.answer,
      explain: q.explain || "",
      refs: q.refs || [],
      point: q.point,
    })),
  };
}

export default function JsonStart({ variant, defaultSection, onStart, onClose }) {
  const [tab, setTab] = useState(defaultSection || "reading");
  const [text, setText] = useState("");
  const [mode, setMode] = useState("untimed");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [fixNote, setFixNote] = useState("");

  const copyPrompt = async () => {
    const prompt = tab === "reading" ? readingPrompt : englishPrompt;
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
    let raw;
    try {
      const parsed = tolerantParse(text);
      raw = parsed.value;
      setFixNote(fixSummary(parsed.fixes));
    } catch (e) {
      setFixNote("");
      setError(e.message);
      return;
    }
    try {
      const test = normalize(tab, raw);
      setError("");
      onStart(test, mode);
      if (variant === "modal") onClose();
      else setText("");
    } catch (e) {
      setError(e.message);
    }
  };

  const body = (
    <div className="jsonstart">
      <div className="tabs rise d3" role="tablist" aria-label="JSON section">
        {["reading", "english"].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            type="button"
            className={tab === t ? "tab active" : "tab"}
            onClick={() => {
              setTab(t);
              setError("");
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>
      <p className="muted-text">
        Paste 1 {tab} passage ({tab === "reading" ? "9 questions · 10 min" : "5 or 10 questions"}).
        Reading paras are plain strings + exact-quote refs; English paras use span arrays like the practice files.
      </p>
      <div className="jsonstart-row">
        <button
          type="button"
          className="footer-link"
          onClick={() => {
            setText(tab === "reading" ? SAMPLE_READING : SAMPLE_ENGLISH);
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
      <button type="button" className="btn-primary" onClick={start} disabled={!text.trim()}>
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
