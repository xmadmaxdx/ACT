#!/usr/bin/env node
/* Validates an ACTprep content JSON without touching anything else.
 * Usage: node validate-json.mjs <path-to-json>
 * Exit 0 = green, 1 = problems listed.
 */
import { readFile } from "node:fs/promises";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node validate-json.mjs <path-to-json>");
  process.exit(1);
}

const doc = JSON.parse(await readFile(file, "utf8"));
const problems = [];
const seenIds = new Set();

for (const test of doc.tests || []) {
  if (!test.id) problems.push("test missing id");
  else if (seenIds.has(test.id)) problems.push(`${test.id}: duplicate id`);
  else seenIds.add(test.id);
  if (!Array.isArray(test.passages)) problems.push(`${test.id}: passages not an array`);
  if (!Array.isArray(test.questions)) problems.push(`${test.id}: questions not an array`);

  const underlined = new Set();
  (test.passages || []).forEach((p) =>
    (p.paras || []).forEach((pa) =>
      (pa || []).forEach((s) => {
        if (s && s.u !== undefined) underlined.add(s.u);
      })
    )
  );

  (test.questions || []).forEach((q, i) => {
    const label = `${test.id} Q${q.n ?? i}`;
    if (!q.tag) problems.push(`${label}: missing tag`);
    if (!q.stem) problems.push(`${label}: missing stem`);
    if (!Array.isArray(q.options) || q.options.length !== 4)
      problems.push(`${label}: needs exactly 4 options`);
    if (!"ABCD".includes(q.answer)) problems.push(`${label}: bad answer key`);
    const wholePassage = /placement/i.test(q.tag || "");
    if (!underlined.has(q.n) && !q.point && !wholePassage)
      problems.push(`${label}: no underline span or point`);
    if (typeof q.explain !== "string" || !q.explain)
      problems.push(`${label}: missing explanation`);
  });

  if (test.questions && test.total !== test.questions.length)
    problems.push(`${test.id}: total ${test.total} != ${test.questions.length} questions`);
}

if (problems.length > 0) {
  console.error(`FAIL ${file}:\n - ${problems.join("\n - ")}`);
  process.exit(1);
}

const counts = (doc.tests || []).map((t) => `${t.id}:${(t.questions || []).length}Q`).join(" ");
console.log(`OK ${file} :: ${counts}`);