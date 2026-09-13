# ACTprep KNOWLEDGE BASE

**Checkpoint:** 13.09.2026 (git 8cc0faa). This file describes ACTprep as of that checkpoint. The app may have
been enhanced or modified since — always open and search the relevant file(s) to confirm the
current shape before changing anything. Never assume a selector, prop, or schema is unchanged.

## WORK DIRECTIVES (ALWAYS)

- Ship 100% complete, real code. No stubs, no TODOs, no half states, no "99% done, 1% remains".
- Every screen state covered: loading, empty, error, full, mobile widths, timed/untimed, review mode,
  paused, expired. If a state can render, it must render correctly.
- Edge cases enumerated and handled up front: empty arrays, null/undefined, out-of-range indexes,
  malformed JSON, missing env, failed fetches, timer at 0, overlapping marks, duplicate keys.
- When in doubt about an API/fact: if the question is simple, ask the user; otherwise search the web
  with websearch MCP (never guess library behavior from memory).
- No `as any` / `@ts-ignore` equivalents, no empty catch blocks (log with `window.console.debug`),
  no silent failures, no commented-out code left behind.
- Match existing patterns exactly (naming, BEM-lite classes, error strings, log strings).

## OVERVIEW

ACTprep is a Duolingo-styled ACT practice web app (Vite + React 18, single `styles.css`, Supabase
backend). Routes: home, practice, test-info, chapters, combo, test (`/practice-test-*`), results.
Tests come from Supabase tables, local JSON seeds, math-chapter minis, or AI-generated JSON pasted
into JsonStart. English scale = stretched Form J08 40Q table to 50Q (`scoring.js`).

## STRUCTURE

```
ACTprep/
├── index.html            # Nunito font, #root, /src/main.jsx
├── package.json          # react 18.3, vite 6, katex, perfect-freehand, @supabase/supabase-js
├── netlify.toml          # build npm run build → dist; SPA redirect /* → /index.html
├── scripts/              # seed-supabase.mjs, seed-lessons.mjs, seed-chapters.mjs,
│                         # validate-chapters.mjs, validate-json.mjs
└── src/
    ├── main.jsx          # createRoot + StrictMode
    ├── App.jsx           # router + session orchestration (see CODE MAP)
    ├── scoring.js        # englishScaled / composite / formatPace / lettersFor
    ├── supabase.js       # fetchCatalog / fetchMinis / fetchChapters / buildMiniTest
    ├── tolerantJson.js   # tolerantParse / fixSummary (AI-JSON repair)
    ├── styles.css        # 3686-line design system (see DESIGN SYSTEM)
    ├── components/       # 19 .jsx (see src/components/AGENTS.md)
    └── data/             # 5 JSON + 2 AI prompt .md (see src/data/AGENTS.md)
```

## WHERE TO LOOK

| Task | Location | Notes |
|---|---|---|
| Routing / session start-finish-review | `src/App.jsx` | slugFor/slugToId/routeFromPath; session {skill,mode,picks,flags,paces} |
| Test-taking screen (all interactive tools) | `src/components/TestScreen.jsx` | ~1800 lines; elimination, highlights, ptime, calc, Desmos |
| Score math | `src/scoring.js` | stretch formula; lettersFor (Reading even n → F,G,H,J) |
| Backend reads | `src/supabase.js` | 15s timeout; id `stripPrefix("x:")`; needs VITE_SUPABASE_URL/KEY |
| Pasted AI tests | `src/components/JsonStart.jsx` + `src/tolerantJson.js` | normalize() validates; prompts imported `?raw` |
| Results / combo | `src/components/Results.jsx`, `ComboResults.jsx` | ScoreRing/MiniRing, miss lists, GO-to-review |
| Practice hub / chapters / courses | `Practice.jsx`, `Chapters.jsx`, `TestInfo.jsx` | skill cards, minis→test via miniTest(), lesson embeds |
| Whiteboard | `FreestyleBoard.jsx` + `BoardTextEditor.jsx` | perfect-freehand strokes, text objects |
| Math rendering | `MathText.jsx` (mathRich) | `$inline$`, `$$display$$`, `*italic*`, `__underline__` |
| Styling | `src/styles.css` | tokens + 23 keyframes + breakpoints below |

## CODE MAP (top symbols)

| Symbol | Type | Location | Role |
|---|---|---|---|
| App (default) | component | `src/App.jsx` | route state, session/catalog/combo state, deep-link resume |
| slugFor / slugToId / routeFromPath | fn | `src/App.jsx:18,24,32` | URL ↔ skill-id mapping (`/practice-test-<skill>-<section>`) |
| startTest / startLessonTest / finishTest / goReview | callback | `src/App.jsx` | session lifecycle; finish appends combo run |
| TestScreen (default) | component | `src/components/TestScreen.jsx` | picks/flags/paces/elims/marks/ptimers; keyboard nav |
| findQuote / ORDINAL / stemRefs | fn/const | `TestScreen.jsx:11,28,39` | fuzzy quote match; stem-derived official highlights (quotes→marks, ordinals→whole para) |
| renderParaText / renderSpans | fn | `TestScreen.jsx` | string paras (ref+user marks) / span arrays (`{t},{u},{box},{fig}`) |
| tickSound / tripleTick / ensureAudio | fn | `TestScreen.jsx` | WebAudio escapement tick (bandpass noise + knock, alternating bright/dark) |
| englishScaled / composite / formatPace / lettersFor | fn | `src/scoring.js` | scale, average-rounded composite, `m:ss`, option letters |
| fetchCatalog / fetchMinis / fetchChapters / buildMiniTest | fn | `src/supabase.js` | Supabase assembly into shared test shape |
| tolerantParse / fixSummary | fn | `src/tolerantJson.js` | comments, trailing commas, inner quotes, raw newlines; fix counts |
| JsonStart (default) / normalize | comp/fn | `src/components/JsonStart.jsx` | modal+page variants; strict schema validation with Q-numbered errors |
| ScoreRing / MiniRing / runStats | comp/fn | `Results.jsx` / `ComboResults.jsx` | `/36` rings; per-run correct/scaled/pace/missed |
| Practice / Chapters / TestInfo | comp | `components/` | tabs+skill cards; chapter→mini→test; lesson viewer + embeds |
| FreestyleBoard / BoardTextEditor | comp | `components/` | canvas strokes/text; `{commit(),cancel()}` ref handle |
| mathRich / MathText | fn/comp | `src/components/MathText.jsx` | KaTeX + markup renderer used by passages/stems/options |

Shared test shape (Supabase, minis, JsonStart all converge):
`{id, title, section, total, timeMinutes, passages:[{id,title,paras}], questions:[{n,p,tag,stem,options[4],answer,explain,refs?}]}`.
English paras = span arrays; Reading paras = plain strings. JSON `refs` accepted but IGNORED by
TestScreen (official highlights derive from stems via `stemRefs`).

## DESIGN SYSTEM (`styles.css`, 3686 lines, no imports, inline SVG only)

Design language: Duolingo English Test look, ACTprep brand. Nunito everywhere except Georgia serif
for passage prose and ui-monospace for the JSON input.

Tokens (`:root`): `--green #58cc02`, `--green-dark #58a700`, `--green-shadow #46a302`,
`--blue #1cb0f6`, `--blue-dark #1899d6`, `--blue-light-bg #ddf4ff`, `--blue-light-border #84d8ff`,
`--ink #3c3c3c`, `--ink-soft #4b4b4b`, `--muted #777`, `--faint #afafaf`, `--line #e5e5e5`,
`--card-border #e5e5e5`, `--bg #fff`, `--purple #7b61b8`, `--radius 12px`, `--font` Nunito stack.
De-facto repeats: `#fff` surfaces, `#f7f7f7` hover, `#d33131`/`#e5484d` danger, `#ffe45e` official
mark, `#b7f0c4` user mark, `#d9f99d` overlap blend, amber `#b25e09/#f5c044/#fff7e6`, green tints
`#f0f9df/#bfe37a`.

Signature patterns (follow exactly):
- Cards: `2px solid` border + `border-bottom-width: 4px` + `border-radius: var(--radius)`.
- Buttons: `box-shadow: 0 4px 0 <dark>`; `:active { translateY(4px); shadow none }`.
- Selected/active: blue-light trio (bg/border/`--blue`).
- Entrance: `.rise` + `.d1–.d4` stagger delays.
- State classes are flat suffixes: `.active .selected .on .correct .wrong .eliminated .danger
  .paused .locked .low .marked .answered .current`.
- BEM-lite kebab: `.test-progress-track`, `.q-option`, `.ptime-card`, `.board-canvas-wrap`.
- 23 keyframes, all used: duo-* (mascot), rise-in, overlay-in/modal-pop, mark-pop/hl-rise,
  timer-blink, ptime-spring/ptime-low, elim-wash/elim-pop, loader-bounce, drawer-in, ring-pop,
  desmos-spin, needle-wobble.
- Breakpoints: 980px (single-column test, static question panel), 900px (page/sidebar stack),
  860px (course stack), 700px (progress hidden, timer full-width row); 8 separate
  `prefers-reduced-motion` blocks kill motion per feature.
- Full section map (26 sections with line ranges), token tables, and animation→usage map live in
  the CSS agent breakdown; re-grep `^@keyframes` / `^@media` to verify counts before refactoring.

## CONVENTIONS

- History API routing (no router lib): `pushState` + `popstate` + `routeFromPath`; deep links
  resume via `pendingRef` only when catalog/minis match, else redirect `/practice`.
- Session object is the contract between App/TestScreen/Results: `{skill{id,title,meta}, mode,
  picks{n:letter}, flags{n:bool}, paces{n:sec}}`. TestScreen remounts per take/review via
  `key={skill.id-take|r{idx}}`.
- Mirrored refs for intervals: `pacesRef/marksRef/ptimersRef` + state (avoids stale closures).
- Timers: main countdown `elapsed` 1s interval + pause lock; passage timers `ptimers[pid]` 500ms
  interval (float `remaining`, display `Math.ceil`); audio ctx created on user gesture only.
- Errors surfaced, never swallowed: `LoaderError` full-screen on catalog failure; JsonStart shows
  `Invalid JSON…` / normalize messages; `fixSummary` announces auto-repairs; catches log via
  `window.console.debug("…skipped", err)`.
- Copy-to-clipboard has manual textarea fallback (`execCommand`) after clipboard API failure.
- Desmos lazy-loads by API key with per-question state save/restore (`desmosStates`, `desmosQRef`).

## ANTI-PATTERNS (THIS PROJECT)

- No router lib, no CSS-in-JS, no UI kit — do not introduce any.
- No `JSON.parse` on user/AI content — always `tolerantParse`.
- No `q.refs` consumption in TestScreen — stems derive highlights (`stemRefs`); `refs` stays in
  JSON/normalize only.
- No new hardcoded colors that duplicate tokens (`#e5e5e5`, brand green/blue) — use the vars.
- No modal without overlay-click-close + `stopPropagation` + `role="dialog"` + aria-label.
- No hover-only open on touch: gate with `matchMedia("(hover: hover)")` + catcher fallback.
- No unkeyed list renders; no smooth-scroll without reduced-motion check.
- Do not commit/push (user never asked); do not run builds unless the user asks.

## COMMANDS

```bash
npm run dev            # vite :5173
npm run build          # ONLY when user explicitly asks
npm run seed[:lessons|:chapters]   # node scripts/seed-*.mjs → Supabase
```

`dist/` is Netlify-published. Env required at runtime: `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY` (else `LoaderError`). Desmos key optional
(`VITE_DESMOS_API_KEY`, has hardcoded fallback).

## NOTES / GOTCHAS

- `main.jsx` uses `React.StrictMode` — effects/intervals must be idempotent (all are; cleanup fns).
- TestScreen hooks sit AFTER an early `if (!testData)` return (works: testData never flips).
- Reading letters alternate A–D / F–J by odd/even n (`lettersFor`); elimanation/copy use letters.
- `pick` toggles (re-click deselects); picking auto-un-eliminates; elims persist per q, shown
  read-only in review; copy includes `Eliminated:` line.
- `stemRefs` regexes: `"…"`/`“…”` quotes ≥2 chars (no single quotes — apostrophes); ordinals
  first…twentieth + last/final + `\d+(st|nd|rd|th)`; out-of-range paras skipped.
- Highlights: quote→`findQuote` offsets stored `{para,text,s,e}` (cap 40/passage, string paras
  only); click mark removes overlap; `Clear highlights · n` in `.hl-bar`; scroll prefers official
  paras, falls back to user marks, skips when already comfortably visible (96px top offset).
- Passage timer: icon-only button until first START (`started` flag); per-passage `{total,
  remaining, running, started}`, survives same-passage nav; ±60s (total 60–3600); reset restores
  total and clears started; mute toggle gates ticks; popover hover-bridged (12px pad + 220ms
  grace); red `.low` ≤60s.
- Chapters 7–10 in `math-chapters.json` are stubs (`theory:null`, empty questions) — not launchable.
- Known build warnings (pre-existing, not errors): supabase.js dynamic+static import chunk note;
  >500kB chunk size warning.

## TESTSCREEN DEEP DIVE (`src/components/TestScreen.jsx`, ~1818 lines)

TestScreen is the whole test-taking experience. It renders in two modes: take (`review=false`) and
review (`review=true`, answers shown, inputs locked). Math tests add a calculator column
(`merged` layout puts QBits under the passage instead of a side panel).

### State inventory (useState)

| State | Shape | Purpose |
|---|---|---|
| `qIndex` | int | active question index into `questions` |
| `picks` | `{n: letter}` | selected options; re-click same letter DESELECTS (delete key) |
| `flags` | `{n: bool}` | flagged-for-review markers |
| `paces` | `{n: sec}` | banked seconds per question |
| `elims` | `{n: [letters]}` | eliminated options per question; survives tool toggle + nav |
| `elimOn` | bool | eliminator tool on/off (bottom-bar toggle, right side) |
| `marks` | `{pid: [{para,text,s,e}]}` | user passage highlights per passage id |
| `hlPop` | `{x,y} \| null` | floating Highlight pill position (viewport coords) |
| `ptimeOpen` | bool | passage-timer popover open |
| `ptimers` | `{pid: {total,remaining,running,started}}` | per-passage timers (default total 600) |
| `ptimeMuted` | bool | gates tick/chime audio |
| `elapsed` | int | main-test seconds (timed mode countdown source) |
| `paused` | bool | timed-mode pause; locks options + stops elapsed |
| `overviewOpen / ovFilter` | bool / All\|Marked\|Unanswered\|Answered | overview drawer |
| `calcOpen / calcMode / calcFull / calcW` | bool / graph\|board / bool / px | calculator panel |
| `introDone / slideIdx` | bool / int | lesson-theory intro slides before math minis |
| `copied` | bool | copy-button feedback (1.5s) |
| `hoverCap` | bool (init once) | `matchMedia("(hover: hover)")` — touch vs mouse popover behavior |

### Ref inventory (useRef mirrors + DOM)

`elapsedRef, enterRef` (pace banking), `prevQRef/prevPassageRef` (nav transitions),
`pacesRef/marksRef/ptimersRef` (interval-safe mirrors — ALWAYS update mirror + state together),
`pausedRef`, `passageWrapRef` (selection scope), `paraRefs: Map("pid-para" → <p>)` (scroll targets),
`pendingHl` (selection payload), `ptimeCloseT` (hover grace timer), `calcApiRef/desmosStates/
desmosQRef` (per-question calc persistence), `boardApiRef/boardStore`, `finishRef/snapshotRef/
autoDoneRef` (expiry auto-finish), `bodyRef` (calc resize measure), `introDoneRef`.

### Effects inventory (mount order)

1. 1s `elapsed` ticker (skips when paused or intro showing).
2. Desmos preload for math tests only.
3. `marks` → `marksRef` mirror sync.
4. 500ms passage-timer ticker: decrements every running `remaining` by 0.5 (rounded to 0.1);
   ticks each beat unless muted; at 0 stops + triple-tick (unless muted).
5. `selectionchange` + capture-phase `scroll` → show/hide `.hl-pop` (same-para string selection
   ≥2 chars only; clamps x/y to viewport).
6. Reading auto-scroll on `qIndex`: official `stemRefs` paras first, user marks fallback; skips
   when target already comfortably visible; 96px top offset; reduced-motion → instant.
7. Question-leave pace banking + passage-change `window.scrollTo(0,0)`.
8. Desmos per-question save/restore.
9. Timed auto-finish at `remaining === 0` (commits pace first).
10. Keyboard map (ignored in inputs): ArrowRight next (or intro-next), ArrowLeft back,
    ArrowUp overview toggle, ArrowDown+Shift/Ctrl/Meta finish, ArrowDown opens calc (math).
11. Unmount: clear `ptimeCloseT`.

### Feature flows

- ELIMINATION: bottom toggle → per-option `.elim-btn` (stagger spring-in; slash icon, restore
  arrow when eliminated) → `.eliminated` class (red sweep `::after`, wash flash, dim text, tilted
  badge). Picking an eliminated letter auto-restores it. Hidden when paused/in review (marks stay
  visible). Copy includes `Eliminated: B, D`.
- HIGHLIGHTS: select text in string para → dark `.hl-pop` pill → `findQuote` resolves offsets →
  stored `{para,text,s,e}`. Painted by `renderParaText` boundary sweep: official `#ffe45e`, user
  `#b7f0c4`, overlap `#d9f99d`. Click a user mark to remove; `.hl-bar` clear-all with count.
  English span-array paras are NOT highlightable (no `data-para`).
- OFFICIAL HIGHLIGHTS (`stemRefs`): `"quoted"` (straight/curly, ≥2 chars, deduped, must be found
  via `findQuote`) lights every containing para; ordinals (first…twentieth, last/final,
  `\d+(st|nd|rd|th)` + `paragraph(s)`, range-checked) light whole paras. No single-quote parsing
  (apostrophes). Runs every render — cheap (short stems).
- PASSAGE TIMER (reading only): `.ptime-btn` icon-only until first START (`started` flag), then
  live `m:ss`. Popover under button (caret, 12px hover-bridge pad + 220ms close grace, touch
  catcher). Ring `r=54` (`PT_CIRC`), 0.5s linear sweep, `.low` red ≤60s. START/PAUSE (restart from
  0 = full restart), ±1:00 (total clamped 60–3600, remaining follows), Reset (total + unstart),
  Sound on/off (speaker icons). Tick = bandpassed noise click (3900/2900Hz alternate) + sine
  knock (640/490Hz, dead in 50ms); finish = 3 rapid ticks. Audio ctx resumes on START gesture.
- OVERVIEW: right drawer, 4 filters, per-row status dot + live pace (active q ticks live),
  intro row when present, click-to-jump (preserves scroll on same passage), FINISH button.
- COPY: question + tag + stem-or-full-passage + options + Desmos equations + eliminated letters;
  clipboard API with textarea/`execCommand` fallback; ✓ feedback.
- REVIEW mode: `showAnswers` → correct/wrong classes + explanations; elim buttons + ptime hidden;
  nav becomes NEXT/RESULT; `startIndex` jumps via `goReview(n)`.

### TestScreen edge cases (all handled)

- `!testData` → "Coming soon" + BACK TO PRACTICE (never blank).
- Empty options/picks (`picks[q.n] || "—"` in results; `picked === letter` guards).
- Timer at 0 → auto-finish once (`autoDoneRef`), never double.
- `remaining` float → display `Math.ceil`, ring uses raw fraction.
- Selection across paras / inside spans / <2 chars → no popup.
- `findQuote` miss → quote silently unlit (never wrong words).
- Out-of-range ordinal (`9th paragraph` of 6) → skipped.
- Duplicate highlights (same para+s+e) → ignored, selection dropped.
- Passage switch → scroll top + fresh refs (keys include pid).
- StrictMode double-effects → all intervals have cleanups; tick alternation may flip twice (harmless).

## COMPONENTS FULL (every file in `src/components/`)

### App-level chrome

- `Header.jsx` (674 B): static top bar. `LogoMark` + `CartIcon` from icons.jsx, guest dot "S".
  No props, no state. Never fetches; purely presentational.
- `Sidebar.jsx` (1209 B): `{active, onNavigate}`. ITEMS = MY TESTS→home, PRACTICE→practice,
  COURSES→info, CHAPTERS→chapters, INSTITUTIONS→null (renders but dead — do not wire without
  asking). Local `ChaptersIcon`; imports Home/Dumbbell/Book/Bank icons.
- `Hero.jsx` (509 B): headline + START PRACTICING (parent passes practice nav via ActionCards
  pattern). Embeds `DuoAnimation`.
- `ActionCards.jsx` (463 B): `{onPractice}`. Cards use DumbbellIcon/ListIcon.
- `Footer.jsx` (1216 B): WEBSITE/PRIVACY/TERMS + HELP pill (all non-functional placeholders),
  internal `BuddyOwl`, `ChatIcon` import.
- `Loader.jsx` (857 B): default `Loader` (logo bounce + LOADING, `role=status`) and
  `LoaderError({message})` (`role=alert`, message echo, RETRY → `location.reload()`).
- `DuoAnimation.jsx` (3798 B): prop-less animated SVG owl (float/breathe/blink/wave classes).
- `icons.jsx` (4172 B): `LogoMark, HomeIcon, DumbbellIcon, BookIcon, BankIcon, ListIcon,
  CartIcon, ChatIcon`. Hand-drawn strokes, `aria-hidden`, Duo palette fills. Add new icons here,
  never inline one-offs in feature files.

### Practice / content entry

- `Practice.jsx` (7800 B): tabs ENGLISH/MATH/READING/COMPLETE (COMPLETE has no real backing test
  — cards still open ModeModal; starting one creates an unmatched skill id → catalog miss →
  redirect `/practice`; do not "fix" silently, ask user). Skill ids `${TAB}-${n}`; passage group
  from `passageTests` (`/-P\d+$/` filter in App). Progress bars hardcoded `0%`/`0/1` (decorative).
  Local card icons (Pencil/Calculator/Layers/OpenBook) in flat Duo sticker style.
- `ModeModal.jsx` (2440 B): `{skill{title,meta}, onClose, onStart}`. `MODES` timed ("Real test
  conditions with a countdown") / untimed (default). Overlay click closes; card stops propagation;
  `role=dialog aria-modal`.
- `Chapters.jsx` (4009 B): `{onStartMini}`. Lazy `import("../supabase.js")` → `fetchChapters()`.
  `miniTest(mini)` builds the shared test shape (section math, intro=theory slides, one passage
  per question `q{n}` with `paras:[[{t:statement}]]`, `stem:""`, `stemSide:"left"`). Sorts by
  trailing id number. Loading + `{error}` states; stub minis (no questions) render but cannot
  start — gate with `questions.length` check before calling `onStartMini`.
- `TestInfo.jsx` (13115 B): courses viewer (`onGiveTest`, `onCourseOpen`). `PracticeEmbed`
  (`{problem, figures}`): local pick → CHECK → correct/wrong + explanation + retry (resets pick,
  keeps checked=false). Figures via `dangerouslySetInnerHTML` (trusted Supabase SVG only).
- `JsonStart.jsx` (10460 B): `variant page|modal`, `defaultSection`, `onStart(test,mode)`,
  `onClose`. Reading/English tabs, prompt-copy buttons (`navigator.clipboard` + fallback),
  sample JSON constants, textarea input, `tolerantParse` → `normalize()` → `onStart`.
  `normalize` rules: object root; exactly 1 passage; reading paras all strings / english all span
  arrays; ≥1 question; unique `n`; exactly 4 options; answer ∈ `lettersFor`; reading stems
  required; ref para indexes range-checked; `timeMinutes` default 10 (reading) else 7/3.5.
  Errors name the question (`Q${n}: …`). `fixNote` shows `fixSummary` when repairs happened.

### Results

- `Results.jsx` (5015 B): `{session, testData, onGo, onRetake, onExit, showAdd, showCombo,
  onAddSection, onShowCombo}`. `ScoreRing` (r=54, `.ring-anim`). Derives correct/eng/comp/
  avgPace/missed/accuracy; kicker names missing sections ("Add X and Y for an official
  composite"); miss rows show You/Correct/Pace + GO; `perfect-box` when none missed.
- `ComboResults.jsx` (4853 B): `{runs, onGo(runIdx,n), onRetakeRun, onExit, onAddSection}`.
  `MiniRing` (clamped frac), `runStats` per run, composite ring, per-section stat grids with
  RETAKE, per-run miss lists, ADD SECTION while `<2` runs.

### Canvas + math

- `FreestyleBoard.jsx` (41114 B): `{qkey, store, apiRef}`. perfect-freehand pressure strokes
  (size 14, thinning .55), 4 inks (`#1f2937/#1cb0f6/#16a34a/#ea580c`), text objects
  (BoardTextEditor), rotate/resize handles, pan/zoom + dpad, undo. Objects persist per question
  in `store.current[qkey]`; parent snapshots on question leave + calc toggle. MIN_SIZE 20
  (anti-fat-finger), HANDLE_R 12. Rotation math (`rot/toParent/toLocal`) — do not touch without
  testing drag on rotated objects.
- `BoardTextEditor.jsx` (2212 B): forwardRef `{x,y,fontSize,color,initialValue,onCommit,
  onCancel}`; imperative `{commit(),cancel()}`; autofocus + select-all; Enter commits,
  Escape cancels, blur commits.
- `MathText.jsx` (1699 B): `mathRich(text)` splits `$$display$$` then `$inline$`, KaTeX
  `renderToString({throwOnError:false})` with raw-text fallback; `italicRich` handles
  `__u-mark__` (tested-underline style) then `*em*`. `MathText({text,className})` wraps in span.
  Used by passages, stems, options, explanations, lesson blocks.

## ROOT JS FILES FULL (`src/*.js`)

### `main.jsx` (10 lines)

`createRoot(#root)` + `<StrictMode><App/></`. Nothing else. StrictMode is why every effect in
TestScreen has a cleanup — keep it that way.

### `scoring.js` (entire contract)

- `englishScaled(correct, total)`: `raw40 = round(correct/total*40)`; `min(36, max(1,
  round(raw40/40*35)+1))`. Straight-line stretch, NOT the real ACT curve. To swap in the exact
  Form J08 table later, only this function changes — callers stay untouched.
- `composite(scores)`: filters null/undefined, rounds the mean. Single-section composites are
  labeled "Projected … only" in Results — never present as official.
- `formatPace(sec)`: `m:ss` zero-padded; `null/undefined → "—"`. Used for live paces, averages,
  miss rows. Never feed floats (callers round or ceil first).
- `lettersFor(n, section)`: reading + even n → `[F,G,H,J]`; everything else `[A,B,C,D]`.
  JsonStart validation, TestScreen option mapping, and copy labels all derive from this — a
  question's letters are stable within a session because `n` never changes.

### `supabase.js` (195 lines, 4 exports)

- `fetchCatalog()`: parallel `act_tests` + `act_passages` (order position) + `act_questions`
  (order n); throws per-table errors; `Promise.race` 15s timeout ("Supabase request timed out
  after 15s"); maps to shared test shape with `Number(time_minutes)` and `stripPrefix` on
  `r.id`/`passage_id` (strips `"prefix:"` so `ENG:Q1` joins `p1`). Missing URL/KEY throws
  "Supabase env missing at build…" → App shows `LoaderError`.
- `fetchLessons()`: 6 parallel tables (courses/skills/blocks/figures/examples/problems), named
  errors `lessons/<name>: …`; returns `{math:{subject,courses}, english:{subject,lessons:[],
  courses}}` (non-math bucket). Blocks are raw `r.block` objects rendered by lesson viewers.
- `fetchChapters()`: 3 tables, `tailNum` sorts `ch1…ch10` + `MATH-MINI-*-*` numerically (not
  lexicographically — `ch10` after `ch9`); minis carry `done` flag.
- `buildMiniTest(mini)`: mini → test shape (section math, `timeMinutes || 10`, `intro: theory`,
  `figures:{}`). `fetchMinis()` = done minis with questions, used for deep-link resume.
- Client created per call (`createClient(URL, KEY)`); anon key only — never add writes without
  RLS review + user approval.

### `tolerantJson.js` (224 lines, hand-rolled parser — no deps)

`tolerantParse(src)`: BOM strip; `//` + `/* */` comments (outside strings); trailing commas;
unescaped inner quotes resolved by the `isEndQuote` lookahead (a `"` ends a string only if
followed by `,}]:"` + valid value-start, else counted as `innerQuotes` repair); raw newlines
inside strings tolerated; `\uXXXX` + standard escapes. Throws `Error("… at line L, col C near
"…snippet…"")` computed by `loc()`/`fail()`. Returns `{value, fixes}`.
`fixSummary(fixes)`: `"Auto-fixed: 4 inner quotes, 2 trailing commas, 1 comment."`
(singular-aware, `""` when clean). Trust rule: repairs are counted and SHOWN — never silently
repair-then-start without the note.

## DATA SCHEMAS FULL (`src/data/`)

Sizes at checkpoint: english-tests 86,168 B; english-passages 79,998 B; math-chapters 399,876 B;
math-lessons 40,107 B; english-lessons 23,173 B; english-prompt 4,717 B; reading-prompt 5,154 B.

### English test envelope (tests + passages files)

```json
{ "section": "english",
  "tests": [{ "id": "ENGLISH-1", "title": "…", "total": 50, "timeMinutes": 35,
    "passages": [{ "id": "p1", "title": "…",
      "paras": [[ {"t": "plain "}, {"u": 1, "t": "tested"}, {"box": "A"} ]] ] }],
    "questions": [{ "n": 1, "p": "p1", "tag": "Subject-Verb", "stem": "…",
      "options": ["No Change", "a", "b", "c"], "answer": "B", "explain": "…" }] }]}
```

- Passage ids: `ENGLISH-1/2` (50Q/35min full), `ENGLISH-P1…P10` (10Q/7min minis).
- Span kinds: `{t}` plain (may hold `$LaTeX$`), `{u:n,t}` tested underline for question n
  (active q → `.u-mark.active` + numbered `.u-sup` pill), `{box:"A"}` anchor chip (lights when
  `q.point === box`, NEVER for Placement-tagged questions — a lit box would give it away),
  `{fig}` → `figures` map SVG (absent id renders nothing, never crashes).
- Active-question underlines/boxes re-render per `qIndex`; inactive ones stay visible but dim.

### Reading shape (JsonStart-produced; Supabase reading rows mirror it)

Passages: `{id, title, paras: ["plain string", …]}` — strings ONLY (normalize rejects arrays).
Questions: `{n, p, tag, stem (required), options[4], answer, explain, refs?}` with `refs:
[{para, text?}]` validated but ignored at render. Even-n answers use F–J (`"answer": "G"`).

### Chapters / lessons

- `math-chapters.json`: `{subject:"math", chapters:[{id:"ch1", title, subtitle, minis:[{id:
  "MATH-MINI-1-1", title, done, timeMinutes, theory:{heading, blocks:[{p}|{list:[…]}|{math}]},
  questions:[{n,tag,short,statement,options,answer,explain}]}]}]}` — 10 chapters, 42 minis;
  ch1–6 live (4+6+3+3+4+3), ch7–10 STUBS (`theory:null`, `questions:[]`).
- Course files: `{subject, courses:[{id,title,tier,summary,timeMinutes,skills:[{id,title,key}]}]}`.
  `verb-tenses` (english, 8 skills/blocks + cheatsheet), `algebra-foundations` (10+8+formula-sheet),
  `geometry-trigonometry` (9), `probability` (8).

### AI prompts (the contract AI content must obey)

- `reading-prompt.md`: 1 passage / 7–9 paras / 9Q / 10 min; odd A–D even F–J; verbatim-quote refs
  or whole-para `{para}`; ≥6 distinct tags; no option numbers; quotes must exist in passage.
- `english-prompt.md`: 1 passage / 10Q-7min or 5Q-3.5min; span syntax; EVERY question needs a
  `{u:n}` or `{box}` anchor; ≥5 tags; A–D; no option numbers.
- If AI output drifts (it does), `tolerantParse` repairs + `normalize` rejects with Q-numbered
  errors — update prompts AND normalize together,   never one side alone.

## CSS SECTION-BY-SECTION (`styles.css`, 3686 lines)

Unlabeled block at 2236–2424 (test nav) breaks the comment rhythm — keep the rhythm when adding
sections: `/* ---------- Name ---------- */`.

| Lines | Section | Key classes / behavior |
|---|---|---|
| 1–45 | Tokens + reset | 17 vars; `box-sizing`; Nunito body; buttons inherit font |
| 46–109 | Header | `.site-header` sticky 70px; `.brand`; `.icon-button`; `.user-dot` (purple) |
| 110–120 | Layout | `.page` grid `236px 1fr`, max 1100px |
| 121–159 | Sidebar | `.nav-item` hover/active (blue-light trio) |
| 160–215 | Hero | `.hero` grid; `.btn-primary` 3D blue; `.divider` |
| 216–242 | Action cards | 2-col grid; hover lift |
| 243–285 | Footer | `.footer-link`; `.help-pill` fixed bottom-right |
| 286–496 | Duo motion | 8 keyframes; `.duo-buddy` corner peek; `.rise.d1–d4` entrances |
| 497–526 | @900px | 1-col page; horizontal sidebar scroll |
| 527–598 | Practice | `.tabs/.tab.active` underline; `.skill-grid`; ghost numerals |
| 599–707 | Courses | `.course-card(.locked)`; `.lesson-math` box; lesson typography |
| 708–816 | Course page | `.page.full`; sticky `.toc` → horizontal @860px; `.embed-q` |
| 817–852 | Chapters | `.chapter-list`; `.mini-row` locked/hover |
| 853–913 | Intro slide | `.intro-card`; `.intro-dots`; @700px shrink |
| 914–1085 | Examples | `.example-q/.example-discuss`; `.skill-card`; `.progress-*`; `needle-wobble` |
| 1086–1412 | Mode modal | `.modal-overlay/-in`; `.modal/-pop`; `.mode-option.selected`; `.jsonstart-*`; `.ref-mark/.user-mark`; `.hl-pop/-rise`; `.hl-clear` |
| 1413–2164 | Test screen | `.test-topbar` sticky; `.test-right` (margin-left auto); `.ptime-*` popover+ring; `.test-timer(.danger-blink)`; `.passage` serif card; `.u-mark(.active)` + `.u-sup(.active)`; `.box-ref(.active)`; `.question-panel` sticky scroll; `.q-card/.q-option/.q-letter`; eliminator (`.elim-btn/-pop`, `.eliminated/-wash` sweep); `.test-progress` + `.fill-low/.fill-mid` |
| 2165–2234 | Loader | `.loader` fixed; `loader-bounce`; `.loader-error-box` |
| 2236–2424 | Test nav | `.flag-btn(.on)`; `.test-nav` fixed bottom; `.nav-btn(.primary:disabled)`; `.copy-icon-btn(.copied)`; `.elim-toggle(.on)` absolute right; `.nav-count`; @980px wrap |
| 2425–2667 | Overview | `.overview-overlay/-in`; `.overview-drawer/-in` right slide; `.ov-filters/.ov-row(.current)`; `.ov-status(.marked/.answered/.unanswered)` dots; `.ov-pace`; `.ov-finish/.finish-btn` green 3D |
| 2669–2756 | Test states | `.correct/.wrong` + letter variants; `.explain.ok/.no`; `.box-ref.active`; `.missing` |
| 2757–3005 | Results | `.results-hero`; `.score-ring/.ring-anim`; `.stat-grid/.stat-card(.alert)`; `.count-pill`; `.perfect-box`; `.miss-row/.go-btn`; @700px column |
| 3007–3240 | Board | `.board-toolbar/.board-tool(.active)`; color dots; size slider; `.board-svg`; text editor; zoom + `.board-dpad` |
| 3242–3248 | Intro step | `.intro-step` grid span |
| 3249–3562 | Calculator | `.calc-btn(.on)`; 3-col `.calc-open`; `.calc-divider` resize; `.calc-panel`; fullscreen; `.calc-tabs/.calc-tab(.active)`; `.desmos-*` + `desmos-spin`; @980px column |
| 3564–3686 | Timer/pause | `.test-timer-wrap` absolute-center; `.pause-btn`; `.test-timer.paused`; `.q-options.locked`; `.paused-note`; @700px full-width timer row |

Animation→usage (all 23 verified by grep): duo-float (duo-wrap, art-clock), duo-breathe,
duo-blink (eyes), duo-wave, badge-pop, shadow-pulse, spark-twinkle, buddy-peek, rise-in,
needle-wobble, overlay-in (modal + overview), modal-pop, mark-pop, hl-rise, timer-blink,
ptime-low, ptime-spring, elim-wash, elim-pop, loader-bounce, drawer-in, ring-pop, desmos-spin.
Ring pattern repeated 3× (ScoreRing/MiniRing/ptime): track circle + arc with dashoffset +
rotate(-90); transitions `stroke-dashoffset 1s linear` (ptime 0.5s). Never pass unsanitized HTML —
  only KaTeX output goes through `dangerouslySetInnerHTML`.
