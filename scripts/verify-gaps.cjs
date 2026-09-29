/* verify-gaps: exercises gapsEngine deterministically. Exit non-zero on any
   failure. Usage: node scripts/verify-gaps.cjs */
const { pathToFileURL } = require("node:url");
const path = require("node:path");

let failures = 0;
function check(name, cond, extra) {
  if (cond) {
    console.log(`ok - ${name}`);
  } else {
    failures += 1;
    console.log(`FAIL - ${name}${extra ? ` (${extra})` : ""}`);
  }
}

async function main() {
  const engine = await import(
    pathToFileURL(path.join(__dirname, "..", "src", "gapsEngine.js")).href
  );
  const {
    tokenize,
    splitSentences,
    shownCount,
    mulberry32,
    buildGaps,
    buildSingleGap,
    scoreGaps,
    FUNCTION_EASIES,
    PASSAGE_GAP_COUNT,
  } = engine;

  // 1. Tokenizer is lossless.
  const tricky = "Don't stop — well, keep going! It's 3:40 p.m. now.";
  const toks = tokenize(tricky);
  check("tokenize lossless", toks.map((t) => t.t).join("") === tricky);
  check("tokenize finds words", toks.some((t) => t.word && t.t === "going"));

  // 2. Shown-letter split.
  check("shown mood=2", shownCount("mood") === 2);
  check("shown you=1", shownCount("you") === 1);
  check("shown determination=7", shownCount("determination") === 7);

  // 3. Single-sentence drill.
  const single = buildSingleGap(
    "Waking up to the sound of birds outside my window puts me in a good mood.",
    mulberry32(7)
  );
  check("single: 1 gap", single.gaps.length === 1);
  check("single: boxes>=1", single.gaps[0].boxes >= 1);
  check(
    "single: shown+boxes=answer",
    single.gaps[0].shown.length + single.gaps[0].boxes === single.gaps[0].answer.length
  );
  check(
    "single: content word",
    single.gaps[0].answer.length >= 4 &&
      !FUNCTION_EASIES.includes(single.gaps[0].answer.toLowerCase())
  );

  // 4. Passage drill on a 7-sentence text.
  const text = [
    "Success is not as important as determination.",
    "Even if you fail, you should aim to work your hardest to solve a difficult problem.",
    "In the end, that skill will take you farther than succeeding at everything you face.",
    "The famous writer Ernest Hemingway rewrote entire chapters before breakfast every morning.",
    "Small habits compound quietly while dramatic gestures fade long before noon every day.",
    "Patient gardeners water young seedlings through every dry summer afternoon without complaint.",
    "Success often requires some luck, but determination and hard work are within your control.",
  ];
  const built = buildGaps(text, PASSAGE_GAP_COUNT, 3, mulberry32(42));
  check("passage: 15 gaps", built.gaps.length === PASSAGE_GAP_COUNT);

  // Map each gap back to its sentence via lockstep walk against tokenize().
  const stok = text.map((s) => tokenize(s));
  const perSent = text.map(() => []);
  let ssi = 0;
  let tti = 0;
  let lockOk = true;
  for (const seg of built.segments) {
    if (seg.gap !== undefined) {
      const exp = stok[ssi][tti];
      if (!exp || !exp.word || built.gaps[seg.gap].answer !== exp.t) lockOk = false;
      else perSent[ssi].push(exp.t);
      tti += 1;
    } else {
      const exp = stok[ssi][tti];
      if (exp !== undefined && exp.t === seg.t) {
        tti += 1;
      } else if (tti === stok[ssi].length && seg.t === " " && ssi < text.length - 1) {
        ssi += 1;
        tti = 0;
      } else {
        lockOk = false;
      }
    }
  }
  check("segments lockstep with tokenize", lockOk);
  check("passage: first sentence clean", perSent[0].length === 0);
  check("passage: last sentence clean", perSent[perSent.length - 1].length === 0);
  const easyHits = built.gaps.filter((g) =>
    FUNCTION_EASIES.includes(g.answer.toLowerCase())
  ).length;
  check("passage: 3 easies", easyHits === 3, `got ${easyHits}`);
  check(
    "passage: no proper nouns",
    built.gaps.every((g) => !/^[A-Z]/.test(g.answer))
  );
  // Non-adjacency: re-tokenize each gapped sentence, gapped word indexes >= 2 apart.
  let adjacent = false;
  text.forEach((s, idx) => {
    const wt = tokenize(s);
    const wi = [];
    wt.forEach((tk, i) => {
      if (tk.word) wi.push(i);
    });
    const mine = [];
    let from = 0;
    for (const word of perSent[idx]) {
      const pos = wi.findIndex((tokIdx, p) => p >= from && wt[tokIdx].t === word);
      if (pos < 0) {
        adjacent = true;
        break;
      }
      mine.push(pos);
      from = pos + 1;
    }
    for (let a = 1; a < mine.length; a++) {
      if (mine[a] - mine[a - 1] < 2) adjacent = true;
    }
  });
  check("passage: gaps never adjacent", !adjacent);

  // 5. Scoring.
  const typedAll = {};
  built.gaps.forEach((g) => {
    typedAll[g.id] = g.answer.slice(g.shown.length);
  });
  const all = scoreGaps(built.gaps, typedAll);
  check("score: all correct", all.correct === all.total);
  const typedNone = {};
  const none = scoreGaps(built.gaps, typedNone);
  check("score: none correct", none.correct === 0);
  const typedSome = { ...typedAll };
  delete typedSome[0];
  typedSome[1] = "zzz";
  const some = scoreGaps(built.gaps, typedSome);
  check("score: partial", some.correct === some.total - 2);
  const typedCase = { ...typedAll, 0: typedAll[0].toUpperCase() };
  check("score: case-insensitive", scoreGaps(built.gaps, typedCase).correct === all.total);

  // 6. Error paths.
  let threw = false;
  try {
    buildGaps(["Only one."], 5, 0, mulberry32(1));
  } catch {
    threw = true;
  }
  check("passage: short text throws", threw);
  threw = false;
  try {
    buildSingleGap("Hi.", mulberry32(1));
  } catch {
    threw = true;
  }
  check("single: tiny sentence throws", threw);

  // 7. Determinism.
  const a = buildGaps(text, PASSAGE_GAP_COUNT, 3, mulberry32(9));
  const b = buildGaps(text, PASSAGE_GAP_COUNT, 3, mulberry32(9));
  check(
    "seeded determinism",
    JSON.stringify(a.gaps) === JSON.stringify(b.gaps)
  );

  // 8. Offset round-trip: rebuild from {text, gaps} matches live segments.
  const { segmentsFromOffsets } = engine;
  const joined = text.join(" ");
  const live = buildGaps(text, PASSAGE_GAP_COUNT, 3, mulberry32(5));
  const revived = segmentsFromOffsets(
    joined,
    live.gaps.map((g) => ({ answer: g.answer, shown: g.shown, start: g.start }))
  );
  const render = (segs, gs) =>
    segs.map((s) => (s.t !== undefined ? s.t : `[${gs[s.gap].answer}]`)).join("");
  const plain = (segs, gs) =>
    segs.map((s) => (s.t !== undefined ? s.t : gs[s.gap].answer)).join("");
  check(
    "offsets round-trip",
    JSON.stringify(revived.gaps.map((g) => [g.answer, g.shown, g.start])) ===
      JSON.stringify(live.gaps.map((g) => [g.answer, g.shown, g.start])) &&
      render(revived.segments, revived.gaps) === render(live.segments, live.gaps) &&
      plain(revived.segments, revived.gaps) === joined
  );
  const badCases = [
    [{ answer: "nope", shown: "n", start: 0 }],
    [{ answer: "Success", shown: "Su", start: -1 }],
    [
      { answer: "Success", shown: "Su", start: 0 },
      { answer: "Success", shown: "Su", start: 2 },
    ],
    [{ answer: "Success", shown: "xyz", start: 0 }],
    [],
  ];
  badCases.forEach((gs, k) => {
    let threw = false;
    try {
      segmentsFromOffsets(joined, gs);
    } catch {
      threw = true;
    }
    check(`offsets reject bad case ${k}`, threw);
  });

  // 9. Manual bank: size, titles, every sentence gappable.
  const bankUrl = pathToFileURL(path.join(__dirname, "..", "src", "data", "gapsBank.js")).href;
  const { GAPS_BANK } = await import(bankUrl);
  check("bank: 50-100 passages", GAPS_BANK.length >= 50 && GAPS_BANK.length <= 100, `got ${GAPS_BANK.length}`);
  const titles = GAPS_BANK.map((p) => p.title);
  check("bank: titles non-empty", titles.every((t) => typeof t === "string" && t.trim().length > 0));
  check("bank: titles unique", new Set(titles.map((t) => t.toLowerCase())).size === titles.length);
  const noText = GAPS_BANK.filter((p) => typeof p.text !== "string" || !p.text.trim());
  check("bank: every passage has text", noText.length === 0);
  const short = GAPS_BANK.filter((p) => engine.splitSentences(p.text).length < 3);
  check("bank: every passage 3+ sentences", short.length === 0, short.map((p) => p.title).join(";"));
  const thin = GAPS_BANK.filter((p) => p.text.split(/\s+/).filter(Boolean).length < 40);
  check("bank: every passage 40+ words", thin.length === 0, thin.map((p) => p.title).join(";"));
  const ungappable = [];
  GAPS_BANK.forEach((p) => {
    engine.splitSentences(p.text).forEach((s, si) => {
      try {
        engine.buildSingleGap(s, engine.mulberry32(1));
      } catch {
        ungappable.push(`${p.title}#${si + 1}`);
      }
    });
  });
  check("bank: every sentence gappable", ungappable.length === 0, ungappable.slice(0, 8).join(";"));

  if (failures > 0) {
    console.log(`${failures} FAILURE(S)`);
    process.exit(1);
  }
  console.log("verify-gaps: green");
}

main().catch((e) => {
  console.log(`FAIL - threw: ${e && e.message}`);
  process.exit(1);
});
