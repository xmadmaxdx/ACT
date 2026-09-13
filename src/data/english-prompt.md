# MASTER PROMPT — ACT English JSON (copy everything below the line and send to any AI)

---

You generate a complete ACT English practice test as a single JSON object in codeblock wrappign in backtick. Output ONLY the JSON object — no explanations, no markdown fences, no commentary, no other.

## 1. Test size (both allowed, 10Q is the default)

- DEFAULT: exactly 1 passage, exactly 10 questions, `"total": 10`, `"timeMinutes": 7`.
- ALLOWED ALTERNATIVE: exactly 1 passage, exactly 5 questions, `"total": 5`, `"timeMinutes": 3.5`.
- Do not mix: 10Q goes with 7 minutes, 5Q goes with 3.5 minutes. Never any other count.
- Question numbers run 1–N with no gaps and no duplicates. `"section"` is exactly `"english"`.
- Give the test a unique id like `"JSON-ENGLISH-<topic>"` (e.g. `"JSON-ENGLISH-rooftop-gardens"`).
- 5Q tests use the same rules below, just fewer questions: 3 correction + 2 rhetoric, minimum 4 different tags.

## 2. Passage types (pick exactly one per test)

Real practice files rotate across these four. Pick the one that fits your topic, and commit to its voice:

1. **Informative / explanatory** (science, history, technology). Formal, neutral, third person. Examples in the data: "The Seed Vault of Svalbard", "The History of Cartography", "The Murmuration of Starlings".
2. **Argumentative / persuasive** (a case for X, answering critics). Thesis up front, evidence, counterargument, conclusion. Example: "The Case for Street Trees", "The Case for Visible Storage".
3. **Biography / profile** (a person, craft, or tradition). Formal historical or journalistic register. Examples: "Alex Atala and Brazilian Cuisine", "Rediscovering Hrosvitha", "The Artful Stitch of Paj Ntaub".
4. **Personal narrative / memoir** (first-person experience). Vivid sensory detail allowed, but grammar rules still test formal written English. Examples: "A Musical Detour", "My Grandmother's Dumplings".

- Title the passage concretely: "The Rooftop Gardens of Chicago", not "English Practice 1".
- One topic per test. No genre shifts mid-passage.

## 3. How the passage must be written

- Length: 300–400 words for 10Q (150–220 for 5Q), split into exactly 4 paragraphs for 10Q (3 paragraphs for 5Q).
- Each paragraph is 60–110 words and does a visible job: Para 1 sets the scene + thesis, middle paras develop evidence or story, final para reflects or concludes.
- Coherent essay first, test vehicle second: every tested issue must sit in a natural spot (a real comma problem, a real wordy phrase, a real flat sentence). Never force an error where a fluent writer would never write one.
- Formal written English throughout. No slang, no contractions in narration, no texting abbreviations — unless the underlined portion is itself the tone error being tested.
- Include 4 placement anchors: `{ "box": "A" }`, `{ "box": "B" }`, `{ "box": "C" }`, `{ "box": "D" }` — one near the end of each paragraph (A in Para 1, B in Para 2, C in Para 3, D in Para 4), exactly like the practice files. Placement and add-detail questions refer to these Points.
- Every tested error must be a REAL error under standard written English. If "No Change" is not the answer, the original underlined text must be unambiguously wrong or unambiguously worse than the correct option.

## 4. Span syntax (the ONLY allowed span shapes — nothing else)

- Plain text: `{ "t": "any prose" }`.
- Tested underline: `{ "u": 3, "t": "exact tested words" }` where 3 is the question number.
- Reference point (no underline): `{ "box": "A" }` — renders as a boxed point marker. Use ONLY for placement / add-detail anchors.
- Figures: `{ "fig": "figure-id" }` only with a top-level `"figures"` map; otherwise never use fig spans.
- Build sentences by concatenation: `[{ "t": "She " }, { "u": 1, "t": "walk" }, { "t": " daily." }]`.

## 5. The 1:1 swap rule for `{u: n}` (strict — the most common AI failure)

- The underlined text must be EXACTLY the slot the options fill. Each of the 4 options must drop into that slot word-for-word with no leftover words, no missing words, and no punctuation or agreement mismatch with the text OUTSIDE the underline.
- Test: paste each option into the sentence in place of the `{u: n}` text. The result must be a complete, punctuated sentence every time — the only difference between options is grammar/style, never a duplicated or dropped neighbor word.
- GOOD: passage `[{ "t": "The 6:10 train " }, { "u": 1, "t": "leave" }, { "t": " right on time." }]` with options `["No Change", "leaves", "leaving", "have left"]` — every option replaces exactly "leave".
- BAD: underlining `"walk daily"` while options are `["walks", "walked", "walking"]` — "daily" is stranded outside some options and swallowed by others. Underline only `"walk"`.
- BAD: underlining `"stores, and preserves,"` including the comma, then offering an option without end punctuation logic — keep surrounding commas/periods OUTSIDE the underline unless the comma itself is what is tested, and then every option must handle that comma position.
- Underline the faulty-or-tested segment ONLY: one verb, one phrase, one transition word, one sentence under discussion for add/delete. Never underline two questions' text in one span. Never leave a `{u: n}` span whose question does not exist.
- Every correction/rhetoric-underlined question number appears as exactly one `{u: n}` span. Placement questions (Point A/B/C/D) and point-anchored add-detail questions have NO `{u: n}` span — they anchor to `{box}` plus `"point"` on the question instead.

## 6. Question types (10Q default mix — use at least 7 different tags)

Correction types (underlined `{u: n}`, option A is always `"No Change"` — see section 7):

- **Punctuation** (commas, apostrophes, colons/semicolons, dashes). Stem: "Which choice makes the sentence most grammatically acceptable?"
- **Sentence Structure** (fragments, run-ons, comma splices, parallelism, modifiers/dangling). Same stem as above.
- **Subject-Verb Agreement**. Same stem. Make the subject hard to find (prepositional phrase or relative clause between subject and verb, e.g. "A row of oaks … shade" → singular "row … shades").
- **Pronoun Agreement / Pronoun Case** (its/it's/their, who/whom, I/me). Same stem.
- **Verb Tense / Verb Form**. Same stem. Hold the tense across the whole passage (past memoir stays past).
- **Word Choice / Concision** (least redundant, avoid wordiness). Stem: "Which choice is least redundant in context?" or "Which choice is clearest and most precise in context?"

Rhetoric types:

- **Transitions** (logical connectors between sentences). Underlined `{u: n}` (one word/phrase). Stem: "Which transition word or phrase is most logical in context?" Options are the connectors themselves.
- **Tone / Diction** (formal register, precise word). Underlined `{u: n}`. Stem: "Which choice most effectively maintains the essay's formal tone?"
- **Rhetoric: Purpose / Main idea** (best accomplishes a stated goal). Underlined `{u: n}`. Stem: "The writer wants to … Which choice best accomplishes that goal?"
- **Rhetoric: Add/Delete** (keep-or-delete with reason). Underlines the sentence under discussion. Stem: "The writer is considering deleting the underlined sentence. Should the sentence be kept or deleted?" Options are "Kept, because … / Deleted, because …" (never "No Change").
- **Rhetoric: Placement / Order**. NO underline — anchors to boxes. Stem: 'The writer wants to add the following sentence: *…* The sentence would most logically be placed at:' Options are exactly `["Point A in Paragraph 1.", "Point B in Paragraph 2.", "Point C in Paragraph 3.", "Point D in Paragraph 4."]`. Add `"point"` only on add-detail questions, not placement ones.
- **Rhetoric: Add Detail** (yes/no with reason at a point). NO underline — anchors to a box via `"point": "D"`. Stem: 'At this point, the writer is considering adding the following sentence: *…* Should the writer make this addition?' Options are exactly `["Yes, because …", "Yes, because …", "No, because …", "No, because …"]` with only one logically correct reason.

Default 10Q recipe: 5–6 correction (at least one each of Punctuation, Sentence Structure, Agreement) + 2 rhetoric-underlined (Transition, Tone) + 1 Placement + 1 Add Detail. Tags must differ on at least 7 of the 10.

## 7. "No Change" rule (strict)

- EVERY correction-type question AND every underlined-rhetoric question lists option A as the exact string `"No Change"` (capital N, capital C).
- Only 2–4 of those "No Change" options are actually CORRECT across a 10Q test (1–2 in a 5Q test). The rest must be genuinely wrong or worse — never a coin flip.
- Correct answers must spread across letters: at least one correct A, one B, one C, one D per 10Q test. Never more than 4 correct on the same letter, never all the same letter.
- Placement and Add-Detail questions NEVER use "No Change" — they use Point / Yes-No options as specified above.

## 8. Make the options hard (strict)

- All 4 options must be plausible at first glance: same length family (within ~3 words of each other), same register, no joke options, no obviously ungrammatical throwaways.
- Distractors must each break a DIFFERENT rule or miss the rhetorical goal differently: one punctuation error, one agreement error, one wordiness error — never three variants of the same mistake.
- The best distractor must be genuinely tempting: a comma-vs-semicolon near-miss, an its/it's/their trap, a "moreover" that almost works, a vivid but off-goal rhetoric choice. A strong student should have to apply the rule, not just hear the error.
- Keep the tested slot identical across options (section 5): no option may add, drop, or reorder words outside the underlined slot. Do not give the answer away by making it the only option with correct surrounding punctuation.
- No twin options: no two options may be synonymous or express the same logic such that both would be equally right or equally wrong — on the real ACT, twins are both automatically wrong, so a key with a twin is a broken question. Transitions: if the correct connector is additive ("In addition"), no other option may be additive ("Furthermore", "Moreover", "Also") — the three distractors must each signal a DIFFERENT logic (contrast, cause-effect, sequence). Mirror this for contrast or cause-effect keys. Same ban for Diction/Tone: never offer two equally precise, equally formal paraphrases of the same meaning.
- Explanations name the rule ("comma splice joins two independent clauses…", "singular subject 'row' needs 'shades'…") AND say why the best distractor fails. 1–2 sentences.

## 9. Output JSON schema (exact keys, exact types)

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
      "tag": "string, question type from section 6",
      "stem": "string (use the standard stem for the type)",
      "short": "string, 2–5 word label shown in overview lists",
      "options": ["exactly 4 strings; correction types start with No Change"],
      "answer": "one of A/B/C/D",
      "explain": "string, 1–2 sentences: the rule applied + why the best distractor fails"
    }
  ]
}

- Add-detail questions also carry `"point": "A"|"B"|"C"|"D"`. No other question carries `"point"`.
- Never number the option strings ("A. …", "F. …"). Options are bare text; letters come from position.
- `$LaTeX$` and `*italics*` may appear in prose/options/explanations; they render formatted.

## 10. Answer–explanation lock (anti-bug — the #1 failure mode)

Real failure seen in production: the `"answer"` letter said B while the explanation's own reasoning proved A ("No Change") correct — letter, option text, and explanation disagreed. This must NEVER happen. Enforce this lock on every question:

- Correct TEXT first, letter second, explanation last. Decide which option text is correct from grammar alone. Then note its letter. Then write the explanation FOR that letter. Never pick a letter first and justify it afterwards.
- The explanation must quote or uniquely describe the correct option's distinguishing words AND explain exactly why every other option fails — naming "No Change" explicitly when it is wrong (quote the underlined defect as written). If the explanation's reasoning points at any option other than the `"answer"` letter, the question is broken: fix it, do not ship it.
- No-Change consistency: if `"answer"` is `"A"`, the explanation must state the underlined original is already correct and why the three replacements are worse. If `"answer"` is not `"A"`, the explanation must state precisely what is wrong with the EXACT "No Change" text as written — never describe an imagined variant ("A lacks the comma" is forbidden when option A contains a comma; re-read the options as written, not as intended).
- One correct only: test-fit EACH of the 4 options into the underlined slot. Exactly one must be fully grammatical and goal-satisfying. Zero or two passing = rewrite the options.
- All 4 option strings must be pairwise DISTINCT as literal text — every character, comma, and capital letter. Never ship two options with identical wording, including "No Change" duplicating another letter (A and C with the same text while the explanation claims they differ is a failure). If two options would read identically, rewrite one until all four visibly differ.
- "No Change" must reproduce the `{u: n}` text character-for-character. No Change means "keep this exact text" — the explanation may never describe No Change as containing or lacking a word or mark that the underlined text does not contain or lack.
- Every claim the explanation makes about an option must be literally true of that option's text. "A and B isolate the clause with a comma" is writable only if A and B both actually contain that comma — verify each claim against the option strings as written.
- Silent per-question sign-off before outputting: (1) correct option pasted into the sentence reads correctly; (2) No Change pasted in fails for the stated reason; (3) explanation names the correct letter plus its exact distinguishing text; (4) `"answer"` equals that letter.

## 11. Full worked example (10Q, 7 min — imitate this shape exactly, NEVER reuse its content)

- Do NOT output this exact example. It is a shape reference only — always invent a fresh topic, title, passage prose, and questions. Any test reusing "The Rooftop Gardens of Chicago" or its sentences verbatim is a failure.

{
  "id": "JSON-ENGLISH-rooftop-gardens",
  "title": "The Rooftop Gardens of Chicago",
  "section": "english",
  "total": 10,
  "timeMinutes": 7,
  "passages": [
    {
      "id": "p1",
      "title": "The Rooftop Gardens of Chicago",
      "paras": [
        [
          { "t": "On a July morning eleven stories above State Street, volunteers haul soil, seedlings, and hoses across a gravel roof. The city stretches below them, hot and loud, while above the street the garden " },
          { "u": 1, "t": "tends, and waters, more than two hundred planter boxes" },
          { "t": " in neat rows. " },
          { "u": 2, "t": "Designed as a refuge for pollinators," },
          { "t": " the garden feeds bees, butterflies, and beetles from May to October. " },
          { "box": "A" }
        ],
        [
          { "t": "The idea is simple. A single tray of sedum " },
          { "u": 3, "t": "shade the roof and cool the air." },
          { "t": " " },
          { "u": 4, "t": "even when the summer heat arrives and temperatures climb." },
          { "t": " " },
          { "box": "B" }
        ],
        [
          { "t": "Some trays failed in the first frost. " },
          { "u": 7, "t": "However," },
          { "t": " the crew replanted them with hardier sedums. At first, the crew taught " },
          { "u": 5, "t": "my coworkers and I" },
          { "t": " how to test the soil without crushing the seedlings. Mine crumbled every time. " },
          { "u": 6, "t": "The whole setup was pretty cool because the plants grew like crazy." },
          { "t": " " },
          { "box": "C" }
        ],
        [
          { "t": "Today the garden hosts school visits, lunch breaks, and quiet mornings. Visitors learn how a thin layer of soil " },
          { "u": 8, "t": "can't escape a harsh winter." },
          { "t": " " },
          { "box": "D" }
        ]
      ]
    }
  ],
  "questions": [
    {
      "n": 1,
      "p": "p1",
      "tag": "Punctuation",
      "stem": "Which choice makes the sentence most grammatically acceptable?",
      "short": "Compound verb commas",
      "options": ["No Change", "tends and waters more than two hundred planter boxes", "tends, and waters more than, two hundred planter boxes", "tends and waters, more than two hundred planter boxes"],
      "answer": "B",
      "explain": "A compound verb takes no comma, and the quantity needs none either. Every comma in A, C, and D wrongly splits the verb or the number phrase."
    },
    {
      "n": 2,
      "p": "p1",
      "tag": "Modifiers/Sentence Structure",
      "stem": "Which choice makes the sentence most grammatically acceptable?",
      "short": "Opening modifier",
      "options": ["No Change", "Designing it as a refuge for pollinators,", "It designed as a refuge for pollinators,", "Designed as a refuge for pollinators and"],
      "answer": "A",
      "explain": "The participle correctly modifies the garden. B dangles (a garden cannot design), C lacks its helping verb, and D strands the phrase with no main clause."
    },
    {
      "n": 3,
      "p": "p1",
      "tag": "Subject-Verb Agreement",
      "stem": "Which choice makes the sentence most grammatically acceptable?",
      "short": "Singular tray verbs",
      "options": ["No Change", "shades the roof and cools the air.", "shade the roof and cools the air.", "shading the roof and cooling the air."],
      "answer": "B",
      "explain": "The subject is the singular tray, so both verbs need singular forms. A and C use plural shade, and D leaves the sentence with no main verb."
    },
    {
      "n": 4,
      "p": "p1",
      "tag": "Concision/Redundancy",
      "stem": "Which choice is least redundant in context?",
      "short": "Heat redundancy",
      "options": ["No Change", "even when the hot summer heat arrives in summer.", "even when the heat arrives and keeps arriving.", "even when the heat arrives."],
      "answer": "D",
      "explain": "Summer heat arriving already implies temperatures climbing. D says it once; A, B, and C restate the heat or the arrival."
    },
    {
      "n": 5,
      "p": "p1",
      "tag": "Pronoun Case",
      "stem": "Which choice makes the sentence most grammatically acceptable?",
      "short": "Object pronoun",
      "options": ["No Change", "my coworkers and me", "my coworkers and myself", "we"],
      "answer": "B",
      "explain": "The pronoun is the object of taught, so it takes the objective case me. A uses nominative I, C misuses reflexive myself, and D cannot serve as the object here."
    },
    {
      "n": 6,
      "p": "p1",
      "tag": "Rhetoric: Tone",
      "stem": "Which choice most effectively maintains the essay's formal tone?",
      "short": "Formal tone",
      "options": ["No Change", "was nice since the plants grew a lot.", "thrived, as the plants grew quickly in the shallow beds.", "is fun because the plants went wild."],
      "answer": "C",
      "explain": "Thrived and the precise clause match the formal register. A is chatty, B is flat, and D is slang."
    },
    {
      "n": 7,
      "p": "p1",
      "tag": "Rhetoric: Transition",
      "stem": "Which transition word or phrase is most logical in context?",
      "short": "Contrast transition",
      "options": ["No Change", "Moreover,", "For example,", "Instead,"],
      "answer": "A",
      "explain": "However marks the contrast between failed trays and replanting. Moreover adds, For example illustrates, and Instead substitutes — none fits a recovery."
    },
    {
      "n": 8,
      "p": "p1",
      "tag": "Rhetoric: Diction",
      "stem": "Which choice maintains the essay's formal tone while stating the consequence?",
      "short": "Precise idiom",
      "options": ["No Change", "cannot hide from a harsh winter.", "has no shelter from a harsh winter.", "is not immune to a harsh winter."],
      "answer": "D",
      "explain": "Immune to is the precise formal idiom. A leans on a contraction, while B and C are colloquial."
    },
    {
      "n": 9,
      "p": "p1",
      "tag": "Rhetoric: Placement",
      "stem": "The writer wants to add the following sentence to the essay: *The crew now trains new volunteers every spring.* The sentence would most logically be placed at:",
      "short": "Sentence placement",
      "options": ["Point A in Paragraph 1.", "Point B in Paragraph 2.", "Point C in Paragraph 3.", "Point D in Paragraph 4."],
      "answer": "C",
      "explain": "Point C follows the replanting story, so spring training belongs there. A and B come before the crew exists, and D follows the closing reflection."
    },
    {
      "n": 10,
      "p": "p1",
      "point": "D",
      "tag": "Rhetoric: Add Detail",
      "stem": "At this point, the writer is considering adding the following sentence: *Bees from three nearby hives visit the roof each morning.* Should the writer make this addition?",
      "short": "Add bee detail",
      "options": ["Yes, because it offers a concrete example of the pollinator refuge the essay describes.", "Yes, because it proves that all city bees now live on this roof.", "No, because it introduces bees, a topic unrelated to rooftop gardens.", "No, because it contradicts the claim that the garden feeds pollinators."],
      "answer": "A",
      "explain": "The bee visits concretely illustrate the refuge claim. B overgeneralizes to all bees, C misreads bees as off-topic, and D reverses the sentence's meaning."
    }
  ]
}

## 12. Variance rotation (never ship the same test twice)

Every generation must be visibly different from the last one: different topic domain, different passage type (section 2), different question-type mix, different answer-letter order, different No-Change-correct positions, different placement/add-detail points. Never repeat the same template twice in a row. Specifically:

- Topic domains must rotate: nature/science, history, art/craft, cities, food, music, sport, technology, memoir, civic life. Never the same domain twice in a row, never generic titles ("English Practice 1").
- Underline positions spread across at least 3 paragraphs; no paragraph holds more than 4 underlines; underline lengths vary (single word, short phrase, full clause, whole sentence for add/delete).
- Stems and distractor mechanisms rotate: not every correction Q uses a semicolon variant; vary comma/apostrophe/colon/agreement/wordiness/register traps across questions. Vary option lengths — some sets short swaps, some full-phrase rewrites.
- Roll one of these 8 official-style patterns per test (modeled on real ACT English passage/Q mixes). Use its tag order, No-Change-correct positions, and anchor points — then vary the letters around them:

1. **Lab Report** (informative science): Punctuation, Sentence Structure, Subject-Verb, Concision, Purpose, Tone, Transition, Diction, Placement, Add Detail. No-Change correct at Q2 + Q6. Placement→C, Add Detail→D.
2. **The Case** (argumentative): Subject-Verb, Purpose (thesis), Supporting Detail, Punctuation, Transition, Counterargument, Placement, Conclusion, Pronoun, Add Detail. No-Change correct at Q1 + Q5. Placement→B, Add Detail→D.
3. **Archive Biography** (history profile): Punctuation (appositive), Sentence Structure, Tone, Transition (contrast), Diction, Purpose, Placement, Cohesion, Punctuation (conjunctive adverb), Add Detail. No-Change correct at Q4 + Q6. Placement→D, Add Detail→C.
4. **Memoir** (first-person story): Verb Tense, Diction (imagery), Pronoun Case, Transition (time), Concision, Purpose, Sentence Structure, Tone, Placement, Add Detail. No-Change correct at Q1 + Q4. Placement→A, Add Detail→C.
5. **Craft Profile** (arts/how-it's-made): Diction, Punctuation (dashes), Tone, Add/Delete, Transition, Punctuation (colon), Concision, Purpose, Placement, Add Detail. No-Change correct at Q5 + Q8. Placement→D, Add Detail→B.
6. **Field Notes** (nature narrative): Purpose, Sentence Structure, Tone, Diction, Transition, Punctuation, Concision, Subject-Verb, Placement, Add Detail. No-Change correct at Q3 + Q7. Placement→A, Add Detail→D.
7. **Explainer** (technology/systems): Diction, Concision, Punctuation, Transition, Pronoun, Sentence Structure, Diction, Purpose, Placement, Add Detail. No-Change correct at Q1 + Q8. Placement→C, Add Detail→B.
8. **Night Drive** (scene-to-idea essay): Punctuation, Concision, Add/Delete, Purpose, Subject-Verb, Pronoun Case, Transition, Diction, Placement, Add Detail. No-Change correct at Q4 + Q6. Placement→B, Add Detail→A.

- 5Q tests use the first 5 tags of the rolled pattern (3 correction + 2 rhetoric) with 1–2 No-Change correct.

## 13. Self-check before outputting

1. Valid JSON (parseable, commas correct). Output ONLY the JSON — no fences, no commentary.
2. 1 passage; 10 questions with 7 min (or 5 with 3.5 min); numbers 1–N with no gaps.
3. Every `{u: n}` appears exactly once and its question exists; every `{box}` point referenced correctly; placement/add-detail questions anchor to boxes with no `{u: n}`.
4. Every option set swaps 1:1 into its underlined slot (section 5 test passes for all 4 options).
5. All answers A–D and spread across letters (at least one of each in 10Q); correction/underlined-rhetoric option A is exactly "No Change" with only 2–4 correct A answers.
6. No span type other than t / u / box (/ fig only with a figures map).
7. No option numbering. Do not write "A. " or "F. " inside option strings. Do not number questions inside stems.
8. Answer–explanation lock (section 10): for EVERY question, the `"answer"` letter, the correct option text, and the explanation all agree — the explanation quotes the correct option's distinguishing words character-for-character and convicts "No Change" by quoting its exact defect. All 4 options pairwise distinct; every explanation claim literally true of the cited option's text.
9. Wrap everything in codeblock, in 3 backtick. SO it outputs in real json format. THis is a must.
10. Variance (section 12): rolled a pattern different from the previous test; underlines spread over 3+ paras; tag mix, key order, No-Change-correct positions, and anchor points all differ from the default example.








