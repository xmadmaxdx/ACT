#!/usr/bin/env node
/* Seeds ACTprep chapter JSONs into Supabase.
 *
 * Usage (super simple):
 *   npm run seed:chapters
 *   node scripts/seed-chapters.mjs --chapter=ch1
 *   node scripts/seed-chapters.mjs --mini=MATH-MINI-1-1
 *
 * Env (or flags --url= --key=, plus .env file support):
 *   SUPABASE_URL               default: https://wfcrlfnjzuutoagbvgyw.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  required (never commit this)
 *
 * Reads src/data/math-chapters.json shaped { subject, chapters: [...] }
 * and upserts each chapter, then replaces its minis + mini questions.
 * Safe to re-run. Zero dependencies — plain Node 18+ fetch.
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

const URL = (args.url || process.env.SUPABASE_URL || "https://wfcrlfnjzuutoagbvgyw.supabase.co").replace(/\/$/, "");
const KEY = args.key || process.env.SUPABASE_SERVICE_ROLE_KEY;
const onlyChapter = args.chapter || null;
const onlyMini = args.mini || null;

if (!KEY) {
  console.error("Missing service key. Run: SUPABASE_SERVICE_ROLE_KEY=<key> npm run seed:chapters");
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

function validateMini(mini) {
  const problems = [];
  (mini.questions || []).forEach((q, i) => {
    if (!Array.isArray(q.options) || q.options.length !== 4) problems.push(`Q${q.n ?? i}: needs 4 options`);
    if (!"ABCD".includes(q.answer)) problems.push(`Q${q.n ?? i}: bad answer key`);
    if (!q.statement) problems.push(`Q${q.n ?? i}: missing statement`);
    if (typeof q.explain !== "string" || !q.explain) problems.push(`Q${q.n ?? i}: missing explanation`);
  });
  return problems;
}

const files = (await readdir(DATA_DIR)).filter((f) => f.endsWith("-chapters.json"));
if (files.length === 0) throw new Error(`no *-chapters.json files in ${DATA_DIR}`);

const candidates = [];
for (const file of files) {
  const doc = JSON.parse(await readFile(join(DATA_DIR, file), "utf8"));
  for (const chapter of doc.chapters || []) {
    for (const mini of chapter.minis || []) {
      candidates.push({ file, subject: doc.subject, chapter, mini });
    }
  }
}
let selected = candidates;
if (onlyChapter) selected = selected.filter(({ chapter }) => chapter.id === onlyChapter);
if (onlyMini) selected = selected.filter(({ mini }) => mini.id === onlyMini);
if (selected.length === 0) throw new Error("nothing selected: no matching chapters/minis in the JSON files");

const chaptersDone = new Set();
let totals = { chapters: 0, minis: 0, questions: 0 };
for (const { file, subject, chapter, mini } of selected) {
  const found = validateMini(mini);
  if (mini.done && found.length > 0) {
    throw new Error(`${file} :: ${mini.id} invalid:\n - ${found.join("\n - ")}`);
  }
  if (!chaptersDone.has(chapter.id)) {
    chaptersDone.add(chapter.id);
    await api("act_chapters?on_conflict=id", {
      method: "POST",
      merge: true,
      body: [
        {
          id: chapter.id,
          subject: subject || null,
          title: chapter.title,
          subtitle: chapter.subtitle || "",
        },
      ],
    });
    totals.chapters += 1;
  }
  await api("act_minis?on_conflict=id", {
    method: "POST",
    merge: true,
    body: [
      {
        id: mini.id,
        chapter_id: chapter.id,
        title: mini.title,
        done: !!mini.done,
        time_minutes: mini.timeMinutes || 10,
        theory: mini.theory || null,
      },
    ],
  });
  await api(`act_mini_questions?mini_id=eq.${encodeURIComponent(mini.id)}`, { method: "DELETE" });
  const questions = (mini.questions || []).map((q) => ({
    mini_id: mini.id,
    n: q.n,
    tag: q.tag || "",
    short: q.short || "",
    statement: q.statement,
    options: q.options,
    answer: q.answer,
    explain: q.explain,
  }));
  if (questions.length > 0) {
    await api("act_mini_questions", { method: "POST", body: questions });
  }
  totals.minis += 1;
  totals.questions += questions.length;
  console.log(`ok  ${mini.id}: ${questions.length} questions${mini.done ? "" : " (stub)"}`);
}

console.log(`done: ${totals.chapters} chapters, ${totals.minis} minis, ${totals.questions} questions`);
