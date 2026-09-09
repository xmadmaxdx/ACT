#!/usr/bin/env node
/* Seeds ACTprep lesson JSONs into Supabase.
 *
 * Usage (super simple):
 *   npm run seed:lessons
 *   node scripts/seed-lessons.mjs --course=probability
 *
 * Env (or flags --url= --key=, plus .env file support):
 *   SUPABASE_URL               default: https://wfcrlfnjzuutoagbvgyw.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  required (never commit this)
 *
 * Reads src/data/math-lessons.json + english-lessons.json shaped
 * { subject, courses: [...] } and upserts each course, then replaces its
 * skills, lesson blocks, figures, worked examples, and practice problems.
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
const onlyCourse = args.course || null;

if (!KEY) {
  console.error("Missing service key. Run: SUPABASE_SERVICE_ROLE_KEY=<key> npm run seed:lessons");
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

async function wipe(courseId) {
  for (const table of [
    "act_lesson_problems",
    "act_lesson_examples",
    "act_course_figures",
    "act_lesson_blocks",
    "act_course_skills",
  ]) {
    await api(`${table}?course_id=eq.${encodeURIComponent(courseId)}`, { method: "DELETE" });
  }
}

function validate(course) {
  const problems = [];
  if (!course.id || !Array.isArray(course.problems)) {
    problems.push("course missing id/problems");
    return problems;
  }
  (course.problems || []).forEach((q, i) => {
    if (!Array.isArray(q.options) || q.options.length !== 4) problems.push(`P${q.n ?? i}: needs 4 options`);
    if (!"ABCD".includes(q.answer)) problems.push(`P${q.n ?? i}: bad answer key`);
    if (!q.statement) problems.push(`P${q.n ?? i}: missing statement`);
    if (typeof q.explain !== "string" || !q.explain) problems.push(`P${q.n ?? i}: missing explanation`);
  });
  (course.examples || []).forEach((e, i) => {
    if (!e.statement) problems.push(`Ex${e.n ?? i}: missing statement`);
    if (typeof e.discuss !== "string" || !e.discuss) problems.push(`Ex${e.n ?? i}: missing discussion`);
  });
  return problems;
}

const files = (await readdir(DATA_DIR)).filter((f) => f.endsWith("-lessons.json"));
if (files.length === 0) throw new Error(`no *-lessons.json files in ${DATA_DIR}`);

const candidates = [];
for (const file of files) {
  const doc = JSON.parse(await readFile(join(DATA_DIR, file), "utf8"));
  for (const course of doc.courses || []) candidates.push({ file, subject: doc.subject, course });
}
const selected = onlyCourse
  ? candidates.filter(({ course }) => course.id === onlyCourse)
  : candidates;
if (selected.length === 0) throw new Error("nothing selected: no matching courses in the lesson JSON files");

let totals = { courses: 0, skills: 0, blocks: 0, figures: 0, examples: 0, problems: 0 };
for (const { file, subject, course } of selected) {
  const found = validate(course);
  if (found.length > 0) {
    throw new Error(`${file} :: ${course.id || "?"} invalid:\n - ${found.join("\n - ")}`);
  }
  await api("act_courses?on_conflict=id", {
    method: "POST",
    merge: true,
    body: [
      {
        id: course.id,
        subject: course.subject || subject || null,
        title: course.title,
        tier: course.tier || "",
        summary: course.summary || "",
        time_minutes: course.timeMinutes || (course.problems || []).length || 10,
      },
    ],
  });
  await wipe(course.id);

  const skills = (course.skills || []).map((s, i) => ({
    course_id: course.id,
    skill_id: s.id,
    title: s.title,
    key: s.key || "",
    position: i,
  }));
  const blocks = (course.lesson || []).map((b, i) => ({
    course_id: course.id,
    position: i,
    block: b,
  }));
  const figures = Object.entries(course.figures || {}).map(([fig_id, svg]) => ({
    course_id: course.id,
    fig_id,
    svg,
  }));
  const examples = (course.examples || []).map((e) => ({
    course_id: course.id,
    n: e.n,
    tag: e.tag || "",
    statement: e.statement,
    figure: e.figure || null,
    discuss: e.discuss,
  }));
  const problems = (course.problems || []).map((q) => ({
    course_id: course.id,
    n: q.n,
    tag: q.tag || "",
    short: q.short || "",
    statement: q.statement,
    figure: q.figure || null,
    options: q.options,
    answer: q.answer,
    explain: q.explain,
  }));

  if (skills.length > 0) await api("act_course_skills", { method: "POST", body: skills });
  if (blocks.length > 0) await api("act_lesson_blocks", { method: "POST", body: blocks });
  if (figures.length > 0) await api("act_course_figures", { method: "POST", body: figures });
  if (examples.length > 0) await api("act_lesson_examples", { method: "POST", body: examples });
  if (problems.length > 0) await api("act_lesson_problems", { method: "POST", body: problems });

  totals.courses += 1;
  totals.skills += skills.length;
  totals.blocks += blocks.length;
  totals.figures += figures.length;
  totals.examples += examples.length;
  totals.problems += problems.length;
  console.log(
    `ok  ${course.id}: ${skills.length} skills, ${blocks.length} blocks, ${figures.length} figures, ${examples.length} examples, ${problems.length} problems`
  );
}

console.log(
  `done: ${totals.courses} courses, ${totals.skills} skills, ${totals.blocks} blocks, ${totals.figures} figures, ${totals.examples} examples, ${totals.problems} problems`
);
