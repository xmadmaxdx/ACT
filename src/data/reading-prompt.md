# MASTER PROMPT — ACT Reading JSON (copy everything below the line and send to any AI)

---

You generate a complete ACT Reading practice test as a single JSON object. Output ONLY the JSON object — no explanations, no markdown fences, no commentary.

## badges (test facts — obey exactly)

- Exactly 1 passage, 7–9 paragraphs, plain strings (no markup inside paras).
- Exactly 9 questions, numbered n: 1–9.
- Time: `"timeMinutes": 10`.
- Section value must be exactly `"reading"`.
- Give the test a unique id like `"JSON-READING-<topic>"`.

## Output JSON schema (exact keys, exact types)

{
  "id": "string, unique, e.g. JSON-READING-NIGHT-SHIFT",
  "title": "string, test title",
  "section": "reading",
  "total": 9,
  "timeMinutes": 10,
  "passages": [
    {
      "id": "p1",
      "title": "string, passage title",
      "paras": ["paragraph 1 full text…", "paragraph 2 full text…"]
    }
  ],
  "questions": [
    {
      "n": 1,
      "p": "p1",
      "tag": "string, question type (see list below)",
      "stem": "string, full question text, required",
      "options": ["exactly 4 strings"],
      "answer": "single letter, must belong to this question's letter set (see letters rule)",
      "explain": "string, 1–2 sentences: why the answer is right AND why the best distractor is wrong",
      "refs": [ { "para": 0, "text": "exact verbatim quote" } ]   // OPTIONAL key — see "refs rule" below
    }
  ]
}

## Answer letters rule (strict)

- Odd-numbered questions (1,3,5,7,9): options labeled A, B, C, D — answer must be one of A/B/C/D.
- Even-numbered questions (2,4,6,8): options labeled F, G, H, J (there is NO E or I) — answer must be one of F/G/H/J.

## refs rule (drives the digital highlighter — read WITH Content Rules)

- `refs` is OPTIONAL. Omit the key entirely when the question points to no specific portion (Content Rule 1/3). Never invent quotes, and NEVER output `"text": ""`.
- Exactly two allowed shapes — nothing else:
  - `{"para": 0, "text": "exact verbatim quote"}` → highlights the quoted words. Use for vocabulary questions and precise phrase/sentence questions.
  - `{"para": 2}` — NO text key → highlights the ENTIRE paragraph. Use ONLY for questions that explicitly mention a paragraph or line range (the "nth paragraph" style, Content Rule 3).
- A ref with a text quote must appear VERBATIM (character-for-character, including punctuation) in that paragraph. Never paraphrase quotes.
- For "line" style questions, quote the precise phrase (a few words), not the whole paragraph.
- For vocabulary questions, quote just the target word plus 1–2 surrounding words.
- The renderer highlights exactly what the shape says: quote-shaped = the words, para-shaped = the whole paragraph, no refs = nothing. Short precise quotes beat long ones.

## Question-type coverage (use at least 6 different tags across the 9)

- Inference ("It can reasonably be inferred…", "The passage most strongly suggests…")
- Explicit detail ("According to the passage…")
- Vocabulary in context ("As used in the passage, the word X most nearly means…")
- Purpose/function ("The main purpose of … is to…", "The author uses … most nearly to mean…")
- Tone/attitude ("The principal tone can best be described as…")
- Comparison/contrast, cause-effect, main idea, character motive, best-summary quotation.

## Quality rules

- Stems are complete sentences ending with a colon, question mark, or clear prompt.
- All 4 options must be plausible; exactly one is textually defensible.
- Distractors: one close-but-wrong (contradicted by one word), others clearly off.
- Explanations cite the passage evidence, never "because it sounds right."
- Correct answers must vary across letters — never make all 9 the same letter.
- Prose quality: literary but readable, roughly 500–700 words total, one coherent scene or argument.


## Content Rules:

1. For general question, DO NOT highlight the texts. The user need to find things from the passage do not highlight.
2. First qs should be main idea of the passage, or related theory qs.
3. For the qs involving mentioning nth paragraph, or line numbers, make the complete paragraph highlighted. But for those does not mention specific portion, should not highlight any sentence or even word unless it is vocab qs.
4. Dont't make qs too obvious to find in passage. in real exam, the infomation finding qs, are a bit difficult to find the qs thing in the passage.


## Self-check before outputting

1. Valid JSON (parseable, commas correct).
2. 1 passage, 7–9 paras, 9 questions numbered 1–9.
3. Every answer letter belongs to its question's set (odd=A–D, even=F–J).
4. Every ref with a text quote exists verbatim in its paragraph; para-only refs carry `{"para": N}` with NO text key; refs omitted entirely for questions that highlight nothing.
5. Answers distributed across letters.
6. The format given as json using codeblock using the three backticks.
7. No option numbering!! Don't number option as "A. " or "F. ". Don't.
