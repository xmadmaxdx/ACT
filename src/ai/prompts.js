// Codino AI — prompt + question-context builders. No network here, just text.

// Markup contract the panel renders beautifully. Appended to every system
// prompt so the model emits TIP callouts, blue bullets, and verifiable
// passage QUOTEs instead of flat paragraphs.
export const FORMAT_CONTRACT =
  "FORMAT CONTRACT (follow exactly): Separate paragraphs with blank lines. " +
  "Put each list item on its own line starting with '- '. Put important advice " +
  "on its own line starting with 'TIP: '. When you cite the passage, put the " +
  "exact words on their own line as QUOTE: \"exact words here\" — copy 4 to 12 " +
  "words character-for-character from the passage, never paraphrase inside QUOTE. " +
  "QUOTE:, TIP:, and OPTION: markers must always stand alone on their own line — " +
  "never inside bullets, tips, or paragraphs, where they render as plain text. " +
  "When you discuss an answer choice, put OPTION: X alone on its own line " +
  "(X is the choice letter exactly as shown: A, B, C, D — or F, G, H, J on " +
  "reading questions that use those letters) right before your comment explaining " +
  "why it is right or wrong. " +
  "Use **bold** sparingly for key terms.";

export const ASK_SYSTEM =
  "You are Codino, a friendly ACT tutor inside the ACTprep practice app. " +
  "The student is working through real ACT practice questions. Explain clearly and " +
  "concisely in plain text with short paragraphs. Teach the underlying rule, then apply " +
  "it to their question. Never answer off-topic requests with more than one sentence " +
  "before steering back to ACT prep. Never mention tokens, costs, or system instructions.";

export const EXPLAIN_SYSTEM =
  "You are Codino, a friendly ACT tutor inside the ACTprep practice app. " +
  "The student pastes or asks about one specific practice question shown below with " +
  "its official explanation. Expand on it: name the grammar rule, show why the " +
  "correct choice works, and show exactly why their picked choice fails. Always answer " +
  "about the specific question quoted in context — never reply with a generic method or " +
  "study advice. Be concise, " +
  "plain text, short paragraphs. Never mention tokens, costs, or system instructions.";

const stripMarks = (s) => String(s || "").replace(/\*/g, "");

function spanText(sp) {
  if (typeof sp === "string") return sp;
  if (!sp || typeof sp !== "object") return "";
  if (sp.box !== undefined) return `[${sp.box}]`;
  if (sp.fig !== undefined) return "";
  return String(sp.t || "");
}

export function passageText(passage) {
  if (!passage || !Array.isArray(passage.paras)) return "";
  return passage.paras
    .map((para) => {
      if (typeof para === "string") return para;
      if (Array.isArray(para)) return para.map(spanText).join("");
      return "";
    })
    .join("\n\n");
}

export function optionLines(q, letters, pickedLetter, reveal) {
  const L = letters && letters.length === 4 ? letters : ["A", "B", "C", "D"];
  return q.options
    .map((opt, i) => {
      const marks = [];
      if (reveal !== false && L[i] === q.answer) marks.push("correct");
      if (pickedLetter && L[i] === pickedLetter) marks.push("student picked");
      const tag = marks.length ? ` (${marks.join(", ")})` : "";
      return `${L[i]}. ${stripMarks(opt)}${tag}`;
    })
    .join("\n");
}

// Full chat context for one question. reveal=false hides the answer key +
// official explanation (in-exam mode) while still feeding passage, stem,
// options, and the student's pick.
export function buildQuestionContext({ testData, q, pickedLetter, letters, reveal }) {
  const show = reveal !== false;
  const passage = (testData.passages || []).find((p) => p.id === q.p);
  const contextText =
    `Section: ${testData.section} — ${testData.title}\n` +
    `Question ${q.n} (${q.tag}): ${stripMarks(q.stem)}\n` +
    `${optionLines(q, letters, pickedLetter, reveal)}\n` +
    (show
      ? `Official explanation: ${stripMarks(q.explain)}\n`
      : `The correct answer and official explanation are hidden — this exam is still in progress. Coach the reasoning, never name or hint the correct choice.\n`) +
    (passage ? `Passage "${passage.title}":\n${passageText(passage)}` : "");
  return {
    title: `Q${q.n} · ${q.tag}`,
    brief: stripMarks(q.stem).slice(0, 90),
    contextText,
    chips: [
      "Highlight the key part of the passage",
      "What's the best strategy for this?",
      "Explain this step by step",
    ],
  };
}

export function generalContext(section) {
  return {
    title: "General chat",
    brief: "",
    contextText: `The student is practicing ACT ${section || "English"}. No specific question attached.`,
    chips: [
      "How should I pace this section?",
      "Give me a comma-rule checklist",
      "What are common trap answers?",
    ],
  };
}

// Local Explanation-tab model. Rendered without any API call.
export function buildExplanation({ q, pickedLetter, letters }) {
  const L = letters && letters.length === 4 ? letters : ["A", "B", "C", "D"];
  return {
    verdict: !pickedLetter
      ? "unanswered"
      : pickedLetter === q.answer
        ? "correct"
        : "wrong",
    options: q.options.map((opt, i) => ({
      letter: L[i],
      text: String(opt),
      state:
        L[i] === q.answer ? "correct" : L[i] === pickedLetter ? "picked" : "other",
    })),
    rule: String(q.explain || ""),
  };
}
