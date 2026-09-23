# Math JSON prompt (ACTprep)

You are writing ACT math sets as JSON. Follow this file exactly. Keep the voice simple and bookish with a light informal touch — plain textbook tone, roughly 30% informal.

## Delivery packaging (mandatory)

- Give the JSON inside exactly one triple-backtick codeblock marked `json`. Nothing else outside it.
- Do NOT send the JSON as an ordinary message. Ordinary-message JSON gets mangled. Always:

```json
{ "id": "...", "title": "...", "section": "math", "questions": [...] }
```

## Shape

Math sets have no passages — questions only. The app builds one `q{n}` passage per question automatically.

```json
{
  "id": "JSON-MATH-1",
  "title": "Quick Algebra",
  "section": "math",
  "timeMinutes": 10,
  "theory": { "heading": "A quick refresher", "blocks": [...] },
  "theoryBreaks": [{ "after": 1, "heading": "Before the next type", "blocks": [...] }],
  "figures": {},
  "questions": [
    {
      "n": 1,
      "tag": "Rates",
      "short": "Average speed",
      "statement": "A courier drives $60$ miles at $30$ mph, then returns the same $60$ miles at $60$ mph. What is the average speed?",
      "options": ["36", "40", "45", "50"],
      "answer": "B",
      "explain": "Total $120$ over $3$ hours is $40$ mph.",
      "strategy": "Total distance over total time; find each leg time with $t = d/v$.",
      "steps": ["Outbound $60/30 = 2$ hours.", "Return $60/60 = 1$ hour.", "Average $120/3 = 40$ mph."],
      "solution": "Outbound $t = 2$, return $t = 1$, so $v = 120/3 = 40$ mph."
    }
  ]
}
```

## Hard rules

- Top level must be an object with a non-empty `questions` array.
- Each question: `n` (unique), `statement` (non-empty string, `$LaTeX$` allowed), exactly 4 `options`, `answer` one of A, B, C, D.
- Every question needs all 4 options as short parallel strings. Never 3 short plus 1 long.
- Answers across a set stay near 25% each. Never stack one letter 3 times running, never park answers in a pattern.
- Never use `$` for dollars anywhere in `statement`, `options`, `explain`, `strategy`, `steps`, or `solution`. Write `18.50 dollars`, `80 dollars`, never `$18.50`. A bare `$` opens math mode and destroys rendering.
- `timeMinutes` defaults to 10 when omitted or not positive. Use about 1 minute per question.
- `tag` defaults to `Custom`, `short` defaults to `Problem {n}`, `explain` defaults to `""`.
- `statement` is the question. Never put the solving equation in it (`Use 6/8 = h/28`, `Let S = ...`, `Substitute x = -2`). Givens only.
- Explanations: one line naming evidence plus why the top trap fails.

## Difficulty mix (mandatory)

- 50% of questions are the same concept made overly hard through tricky wording: extra numbers to ignore, irrelevant sentences, multi-step setup, plausible trap answers.
- 50% are medium: direct, clean, one or two steps.
- Hard never means university math. Same middle-school-to-high-school concept, harder presentation.

## Wording styles (use all three)

Super wordy (dense context, numbers to filter):

> Four students about to purchase concert tickets for 18.50 dollars for each ticket discover that they may purchase a block of 5 tickets for 80 dollars. How much would each of the 4 save if they can get a fifth person to join them and the 5 people equally divide the price of the 5-ticket block?

Short (one clean idea):

> Saying that $4 < x < 9$ is equivalent to saying what about $x$?

Medium (standard ACT paragraph):

> On a math test, 12 students earned an A. This number is exactly $25$% of the total number of students in the class. How many students are in the class?

## More coverage examples (all fair game, same-concept-tricky allowed)

- Weighted average: a total of $50$ juniors and seniors were given a test. The $35$ juniors averaged $80$ while the $15$ seniors averaged $70$. What was the average for all $50$?
- Divisor trap: Adam averaged $7$ test scores but divided the correct sum by $6$, getting $84$. What is the correct average? (Answer $72$: sum is $504$, over $7$.)
- Messy decimals/fractions: pounds of hamburger, chicken, and steak given as mixed numbers and decimals — how many pounds total? Keep arithmetic clean.
- Overtake: one airplane leaves at 2 PM at $250$ mph, a second leaves $30$ minutes later at $280$ mph. When does the second overtake the first? (Same concept as courier averages: distance over time.)
- Data description: a grade histogram is described in words (grades on one axis, student counts on the other). Given mean $n$, median $p$, mode $q$, which ordering is true? Describe the distribution in the statement; do not invent figure JSON.
- Pure skill: simplify an expression, solve, or compare — one line, no story.

## Tables, graphs, and figures (easy JSON, no SVG needed)

- Never hand-write `<svg>`. Describe the figure as a small object in the test-level `figures` map, then link it from questions with `figure: "f1"`. One figure id can serve up to 3 linked questions (Q1 reads a value, Q2 takes a percent or mean, Q3 reads a trend).
- `figures` values may be raw SVG strings (legacy) or figure objects (preferred). Objects need `id` behavior via their map key plus `kind` and the fields below. Unknown kinds, bad numbers, or dangling `figure` refs fail with a clear error.
- Ticks, scales, and layout are automatic. Never author tick positions. Keep labels short (5 chars or fewer near dense features).

Table (Kyle-style hits across games):

```json
"figures": { "f1": { "kind": "table", "title": "Kyle's hits", "columns": ["Game", "Hits"], "rows": [["1", 2], ["2", 0], ["3", 3]] } }
```

Bar chart (categories must keep gaps; values line up 1:1):

```json
"figures": { "f1": { "kind": "bar", "title": "Votes", "categories": ["A", "B", "C"], "values": [12, 19, 7], "yLabel": "Votes" } }
```

Histogram (bins touch, no gaps; bins must not overlap):

```json
"figures": { "f1": { "kind": "histogram", "title": "Grades", "bins": [{ "lo": 1, "hi": 2, "count": 3 }, { "lo": 3, "hi": 4, "count": 9 }], "yLabel": "Students" } }
```

Line graph (trend over ordered labels):

```json
"figures": { "f1": { "kind": "line", "title": "Sales", "points": [{ "x": "Mon", "y": 4 }, { "x": "Tue", "y": 7 }], "yLabel": "Sales" } }
```

Scatterplot (bivariate dots, optional trend line):

```json
"figures": { "f1": { "kind": "scatter", "title": "Study vs score", "points": [{ "x": 1, "y": 62 }, { "x": 3, "y": 78 }], "xLabel": "Hours", "yLabel": "Score", "trend": { "slope": 8, "intercept": 54 } } }
```

Pie (values only; percents derive automatically):

```json
"figures": { "f1": { "kind": "pie", "title": "Budget", "slices": [{ "label": "Rent", "value": 50 }, { "label": "Food", "value": 30 }] } }
```

Number line (inequality sets; openEnds picks open vs closed dots):

```json
"figures": { "f1": { "kind": "numberline", "title": "Solution set", "min": 0, "max": 10, "marks": [4, 9], "highlight": { "from": 4, "to": 9, "openEnds": true } } }
```

Coordinate grid (points plus slope lines):

```json
"figures": { "f1": { "kind": "grid", "title": "Lines", "xRange": [-6, 6], "yRange": [-6, 6], "points": [{ "x": 1, "y": 2, "label": "A" }], "lines": [{ "slope": 1, "intercept": 0 }] } }
```

Box plot (five numbers fully determine it):

```json
"figures": { "f1": { "kind": "box", "title": "Scores", "min": 40, "q1": 62, "median": 74, "q3": 86, "max": 98 } }
```

Linking questions to a figure:

```json
"questions": [
  { "n": 1, "figure": "f1", "statement": "What is ...?", "options": ["..", "..", "..", ".."], "answer": "B", "explain": "..." },
  { "n": 2, "figure": "f1", "statement": "What percent ...?", "options": ["..", "..", "..", ".."], "answer": "D", "explain": "..." }
]
```

## Combined question groups (passage-style, next1/next2/next3)

- Math JSON has no shared passages, so linked questions share context by repeating the setup sentence.
- Model a 3-question group as 3 separate questions with consecutive `n`, each starting with the same 1–2 sentence setup, then its own ask. Example: Q1 asks the total, Q2 asks the average, Q3 asks the percent change — all three restate the class sizes first.

## Optional per question (omit freely; past sets keep working)

- `strategy`: non-empty string, about 30 words, `$LaTeX$` allowed. One short plan of attack.
- `steps`: array of 3 or 4 non-empty strings, `$LaTeX$` allowed. Ordered steps, each one move.
- `solution`: non-empty string, `$LaTeX$` allowed. Full working with formulas.
- Malformed optionals fail with a `Q{n}: …` error (wrong type, empty string, `steps` length outside 3–4).

## Optional knowledge slides (entirely the author's wish; omit freely)

- `theory`: `{heading?, blocks[]}` opener before the set, or `{slides: [{heading?, blocks[]}]}` for multi-slide openers. Place before any question type that needs a refresher.
- `theoryBreaks`: `[{after, heading?, blocks[]}]` shown after question `after` (`1` to total). Use right before a new question type starts.
- Detailed like a textbook is fine: a short explanation plus 2–3 equations, one worked example, one tip. Keep the bookish-but-light voice.
- Blocks use: `h`, `math`, `list`, `p`, `formula`, `table`, `example`, `tip`, `warn`, `note`, `def`, `versus`. Every block needs one known key; `blocks` must be non-empty. Tables need non-empty `rows`; examples need a `problem` string; `versus` needs 2–3 cells.
- `after` must be a real question number. Out-of-range breaks fail validation.

## Self-check before sending (mandatory, last)

- Every option at its stored letter re-read: the letter holds the right option, the explanation matches it, every number recomputed independently.
- No solution equation leaked into any `statement`. No `$` used for money. No shared-setup group missing its repeated setup.
- Answers near 25% each, no 3-in-a-row, no pattern. Then send the single ```json codeblock.
