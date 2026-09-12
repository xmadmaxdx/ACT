# MASTER PROMPT — ACT English JSON (copy everything below the line and send to any AI)

---

You generate a complete ACT English practice test as a single JSON object. Output ONLY the JSON object — no explanations, no markdown fences, no commentary.

## badges (test facts — obey exactly)

- Exactly 1 passage.
- Either 10 questions (timeMinutes 7) or 5 questions (timeMinutes 3.5).
- Section value must be exactly `"english"`.
- Give the test a unique id like `"JSON-ENGLISH-<topic>"`.

## Output JSON schema (exact keys, exact types)

{
  "id": "string, unique",
  "title": "string, test title",
  "section": "english",
  "total": 10,
  "timeMinutes": 7,
  "passages": [
    {
      "id": "p1",
      "title": "string, passage title",
      "paras": [
        [SPAN, SPAN, ...],
        [SPAN, SPAN, ...]
      ]
    }
  ],
  "questions": [
    {
      "n": 1,
      "p": "p1",
      "tag": "string, question type (see list below)",
      "stem": "string (use the standard stem for the type; may be empty only if the meaning is fully carried by options — prefer a real stem)",
      "short": "string, 2–5 word label shown in overview lists",
      "options": ["exactly 4 strings"],
      "answer": "one of A/B/C/D",
      "explain": "string, 1–2 sentences: the rule applied + why the best distractor fails"
    }
  ]
}

## Span syntax (the ONLY allowed span shapes — nothing else)

- Plain text: `{ "t": "any prose (may include $LaTeX$ and *italics*)" }`
- Tested underline: `{ "u": 3, "t": "exact tested words" }` where 3 is the question number. The underline must contain EXACTLY the words the question tests — no more, no less.
- Reference point (no underline): `{ "box": "A" }` — renders as boxed [A]. Use for add/delete/placement anchors.
- Figures: `{ "fig": "figure-id" }` only if a top-level `"figures": {"figure-id": "<svg…>"}` map is included; otherwise never use fig spans.
- Concatenate spans to build sentences: `[{ "t": "She " }, { "u": 1, "t": "walk" }, { "t": " daily." }]`.
- Every question number 1–N must appear as exactly one `{u: n}` span, UNLESS the question is anchored to a `{box}` (add/delete/placement types).

## Underline discipline (strict)

- Correction questions (grammar/punctuation/wording): underline the faulty-or-tested segment only.
- Rhetoric questions about a sentence/portion: underline that whole sentence/portion.
- Add/delete questions: underline the sentence under discussion, or anchor at a `{box}` point.
- Never underline two different questions' text in one span. Never leave a `{u: n}` span whose question doesn't exist.

## Answer letters + options (strict)

- Always A, B, C, D in order. Answer must be one of them.
- For correction-type questions, option A is conventionally "No Change" (exact string).
- All 4 options plausible; exactly one correct. Distractors must each break a different rule or miss the rhetorical goal.
- Correct answers must vary across letters — never all the same letter.

## Question-type coverage (tags — use at least 5 different tags)

- Sentence Structure (fragments, run-ons, comma splices, parallelism)
- Punctuation (commas, apostrophes, colons/semicolons, dashes)
- Subject-Verb Agreement
- Pronoun Agreement / Pronoun Case
- Verb Tense / Verb Form
- Word Choice / Concision (least redundant, avoid wordiness)
- Transitions (logical connectors between sentences)
- Rhetoric: Add/Delete (keep-or-delete with reason)
- Rhetoric: Placement / Order
- Rhetoric: Purpose / Main idea / Tone

Standard stems to reuse: correction types → "Which choice makes the sentence most grammatically acceptable?"; concision → "Which choice is the least redundant in context?"; add/delete → "Should the writer keep or delete the underlined portion?" (answer accordingly).

## Quality rules

- Passage prose: clean, coherent, 250–450 words, natural place for each tested issue (don't force errors where none belong).
- Every tested error must be a REAL error under standard written English.
- Explanations name the rule ("comma splice joins two independent clauses…") and eliminate the best distractor.
- `$LaTeX$` and `*italics*` may appear in prose/options/explanations; they render formatted.

## Self-check before outputting

1. Valid JSON (parseable, commas correct).
2. 1 passage; 10 questions (7 min) or 5 questions (3.5 min); numbers 1–N with no gaps.
3. Every `{u: n}` and every `{box}` referenced correctly; every question has its anchor.
4. All answers A–D, distributed across letters.
5. No span type other than t / u / box (/ fig only with a figures map).
6. The format given as json using codeblock using the three backticks.
7. No option numbering!! Don't number option as "A. " or "F. ". Don't.
