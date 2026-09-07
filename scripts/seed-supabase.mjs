#!/usr/bin/env node
/* Seeds ACTprep content JSONs into Supabase.
 *
 * Usage (super simple):
 *   npm run seed                                push everything
 *   node scripts/seed-supabase.mjs -p -3        push last 3 passages only
 *   node scripts/seed-supabase.mjs -p -1        push last passage only
 *
 * Flags:
 *   -p / --passages   only passage tests (ids like ENGLISH-P1)
 *   -N / --last=N     only the last N of the selection (e.g. -3, -1)
 *
 * Env (or flags --url= --key=):
 *   SUPABASE_URL required
 *   SUPABASE_SERVICE_ROLE_KEY  required (never commit this)
 *
 * Reads every src/data/*.json shaped { section, tests: [...] } and upserts
 * tests, then replaces that test's passages + questions. Safe to re-run.
 * Zero dependencies — plain Node 18+ fetch.
 */

import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

try {
  const raw = await readFile(join(dirname(fileURLToPath(import.meta.url)), "..", ".env"), "utf8");
  raw.split("\n").forEach((line) => {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) return;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  });
} catch {
  /* no .env file — env vars / flags only */
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = join(ROOT, "src", "data");

const rawArgs = process.argv.slice(2);
const args = Object.fromEntries(
  rawArgs.map((a) => {
    const m = /^--([^=]+)=(.*)$/.exec(a);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ""), "1"];
  })
);

// -p / --passages : only passage tests (ids like ENGLISH-P1)
// -N / --last=N   : only the last N of the selected set (e.g. -3, -1)
const passagesOnly = rawArgs.includes("-p") || args.passages !== undefined;
let lastN = null;
for (const a of rawArgs) {
  const m = /^-{1,2}(\d+)$/.exec(a);
  if (m) lastN = parseInt(m[1], 10);
}
if (args.last !== undefined) lastN = parseInt(args.last, 10);
if (lastN !== null && (!Number.isInteger(lastN) || lastN < 1)) {
  console.error("Bad count. Use -1, -3, or --last=2.");
  process.exit(1);
}

const URL = (args.url || process.env.SUPABASE_URL || "https://wfcrlfnjzuutoagbvgyw.supabase.co").replace(/\/$/, "");
const KEY = args.key || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!KEY) {
  console.error("Missing service key. Run: SUPABASE_SERVICE_ROLE_KEY=<key> npm run seed");
  process.exit(1);
}

const base = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

async function api(path, { method = "GET", body, merge = false } = {}) {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    method,
    headers: merge ? { ...base, Prefer: "resolution=merge-duplicates" } : base,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${method} ${path} -> ${res.status} ${text.slice(0, 300)}`);
  }
  return res;
}

function validate(test) {
  const problems = [];
  if (!test.id || !Array.isArray(test.questions) || !Array.isArray(test.passages)) {
    problems.push("test missing id/questions/passages");
    return problems;
  }
  const underlined = new Set();
  test.passages.forEach((p) =>
    (p.paras || []).forEach((pa) =>
      (pa || []).forEach((s) => {
        if (s && s.u !== undefined) underlined.add(s.u);
      })
    )
  );
  test.questions.forEach((q, i) => {
    if (!Array.isArray(q.options) || q.options.length !== 4) problems.push(`Q${q.n ?? i}: needs 4 options`);
    if (!"ABCD".includes(q.answer)) problems.push(`Q${q.n ?? i}: bad answer key`);
    // Whole-passage placement questions (like PT1 Q25/Q35) legitimately anchor nowhere.
    const wholePassage = /placement/i.test(q.tag || "");
    if (!underlined.has(q.n) && !q.point && !wholePassage) problems.push(`Q${q.n ?? i}: no underline span or point`);
    if (typeof q.explain !== "string" || !q.explain) problems.push(`Q${q.n ?? i}: missing explanation`);
  });
  if (test.questions.length !== test.total) problems.push(`total ${test.total} != ${test.questions.length} questions`);
  return problems;
}

const files = (await readdir(DATA_DIR)).filter((f) => f.endsWith(".json"));
if (files.length === 0) throw new Error(`no JSON files in ${DATA_DIR}`);

const candidates = [];
for (const file of files) {
  const doc = JSON.parse(await readFile(join(DATA_DIR, file), "utf8"));
  for (const test of doc.tests || []) candidates.push({ file, section: doc.section, test });
}
const selected = (
  passagesOnly ? candidates.filter(({ test }) => /-P\d+$/.test(test.id || "")) : candidates
).slice(lastN === null ? 0 : -lastN);
if (selected.length === 0) throw new Error("nothing selected: no matching tests in the JSON files");

let totals = { tests: 0, passages: 0, questions: 0 };
for (const { file, section, test } of selected) {
    const problems = validate(test);
    if (problems.length > 0) {
      throw new Error(`${file} :: ${test.id || "?"} invalid:\n - ${problems.join("\n - ")}`);
    }
    await api("act_tests?on_conflict=id", {
      method: "POST",
      merge: true,
      body: [
        {
          id: test.id,
          section: test.section || section || null,
          title: test.title,
          total: test.total,
          time_minutes: test.timeMinutes,
        },
      ],
    });
    await api(`act_questions?test_id=eq.${encodeURIComponent(test.id)}`, { method: "DELETE" });
    await api(`act_passages?test_id=eq.${encodeURIComponent(test.id)}`, { method: "DELETE" });

    const passages = test.passages.map((p, i) => ({
      id: `${test.id}:${p.id}`,
      test_id: test.id,
      title: p.title,
      position: i,
      paras: p.paras,
    }));
    const questions = test.questions.map((q) => ({
      test_id: test.id,
      n: q.n,
      passage_id: `${test.id}:${q.p}`,
      point: q.point || null,
      tag: q.tag,
      stem: q.stem,
      options: q.options,
      answer: q.answer,
      explain: q.explain,
    }));

    await api("act_passages", { method: "POST", body: passages });
    await api("act_questions", { method: "POST", body: questions });

    totals.tests += 1;
    totals.passages += passages.length;
    totals.questions += questions.length;
    console.log(`ok  ${test.id}: ${passages.length} passages, ${questions.length} questions`);
}

console.log(`done: ${totals.tests} tests, ${totals.passages} passages, ${totals.questions} questions`);
