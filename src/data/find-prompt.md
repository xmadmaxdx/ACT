# MASTER PROMPT — ACT Detail-Finding JSON (copy everything below the line and send to any AI)

---

You generate a complete ACT detail-finding practice set as a single JSON object. Output ONLY the JSON object — no explanations, no markdown fences, no commentary.

How this set is used: the student reads the passage, then for each question SELECTS the exact passage words that answer it (no multiple choice). Checking is done by word overlap, so the answer spans below must be precise.

## badges (test facts — obey exactly)

- Exactly 1 passage, 5–7 paragraphs, plain strings (no markup inside paras).
- Exactly 5 questions, numbered n: 1–5.
- Time: `"timeMinutes": 8`.
- Section value must be exactly `"find"`.
- Give the set a unique id like `"JSON-FIND-<topic>"`.
- NO `options` key and NO `answer` key anywhere — questions use `answers` spans instead.

## Output JSON schema (exact keys, exact types)

{
  "id": "string, unique, e.g. JSON-FIND-NIGHT-SHIFT",
  "title": "string, set title",
  "section": "find",
  "total": 5,
  "timeMinutes": 8,
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
      "stem": "string, full instruction, required — tells the student WHAT to select",
      "answers": [ { "para": 1, "text": "exact verbatim span" } ],
      "explain": "string, 1–2 sentences: why this span answers the stem (fed to the AI tutor only, never shown to the student)",
      "refs": [ { "para": 0, "text": "exact verbatim quote" } ]   // OPTIONAL key — see "refs rule" below
    }
  ]
}

## answers rule (the ground truth — read carefully)

- `answers` is REQUIRED, at least 1 entry per question.
- Each entry is `{ "para": <0-based paragraph index>, "text": "<verbatim span>" }`.
- The `text` must appear VERBATIM (character-for-character, including punctuation) in that paragraph. Never paraphrase. The checker finds the span by exact match first, then longest word-run — do not rely on the fallback.
- Keep spans tight: the shortest word-run that fully answers the stem. 3–15 words is ideal. Never span two paragraphs in one entry; use two entries instead.
- If two separate sentences both answer the stem, list BOTH entries — the student needs only one of them.
- For vocabulary questions, the span is the target word plus just enough context to disambiguate it (the word plus 2–4 neighbors).
- `explain` must justify the span against the stem, citing the passage evidence, never "because it sounds right."

## refs rule (hints, NOT answers)

- `refs` is OPTIONAL and means "subtly underline this as a hint," exactly like reading JSON. Omit it when the question should have no hint.
- Same two shapes: `{"para": 0, "text": "exact verbatim quote"}` or `{"para": 2}` (whole paragraph, no text key).
- NEVER put the answer span itself in `refs` for a question meant to be hard — that would give it away. Use refs only for genuinely findable warm-up questions.

## Question-type coverage (use at least 4 different tags across the 5)

- Explicit detail ("Select the words that tell when/where/who…")
- Inference support ("Select the sentence that most strongly supports the idea that…")
- Vocabulary in context ("Select the word or phrase that shows what X means here…")
- Function ("Select the sentence whose purpose is to…")
- Cause-effect, comparison, character motive, best-summary sentence.

## Quality rules

- Stems are complete instructions ending with a period, e.g. "Select the sentence that tells when the power failed."
- Exactly one span (or span set) is textually defensible; near-miss sentences must exist so selection skill matters.
- Difficulty ramp: Q1–Q2 findable, Q3–Q4 require inference, Q5 genuinely tricky (buried detail or paraphrased stem).
- Do not make the answer the first or last sentence every time — vary positions.
- Prose quality: literary but readable, roughly 400–600 words total, one coherent scene or argument.

## Example (follow this shape exactly)

{
  "id": "JSON-FIND-NIGHT-SHIFT",
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
}

## Self-check before outputting

1. Valid JSON (parseable, commas correct).
2. 1 passage, 5–7 paras, 5 questions numbered 1–5.
3. Every answers entry has an integer para in range and a text that occurs verbatim in that paragraph.
4. No `options` key, no `answer` key anywhere.
5. Answer positions vary across paragraphs (not all first/last sentences).
6. The format given as json using codeblock using the three backticks.
