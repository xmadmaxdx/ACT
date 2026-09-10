#!/usr/bin/env node
/* Validates math-chapters.json the way the app renders it.
 *
 * Usage: node scripts/validate-chapters.mjs [path-to-math-chapters.json]
 * Exit 0 = green, 1 = problems listed with mini id, Q number, and file line.
 *
 * What it checks (beyond JSON parse + 4-options/valid-key):
 *  - No `\$` escapes: the renderer splits naively on `$`, so `\$240$`
 *    opens math mode mid-sentence and prose renders as spaced variables
 *    ("p r i z e"). Money MUST live inside math mode: `$240$`.
 *  - Balanced `$` per field (an odd count means math mode never closes).
 *  - No prose leaked into a `$...$` segment (letters running 3+ chars
 *    with no TeX command) — the classic "$240$ prize in the ratio"
 *    mis-split symptom.
 *  - No bare `1,000` commas inside math (use `$52{,}000$`).
 *  - No bare `%` outside math (use `$25\%$`).
 */
import { readFile } from "node:fs/promises";

const file = process.argv[2] ?? "src/data/math-chapters.json";
const raw = await readFile(file, "utf8");
const lines = raw.split("\n");

// index: "MINIID::short" -> 1-based file line (shorts repeat across minis)
const lineOf = new Map();
let curMini = "";
for (let i = 0; i < lines.length; i++) {
  const mid = /"id":\s*"(MATH-MINI-[0-9-]+)"/.exec(lines[i]);
  if (mid) curMini = mid[1];
  const sm = /"short":\s*"((?:[^"\\]|\\.)*)"/.exec(lines[i]);
  if (sm) lineOf.set(`${curMini}::${JSON.parse(`"${sm[1]}"`)}`, i + 1);
}

let doc;
try {
  doc = JSON.parse(raw);
} catch (e) {
  console.error(`FATAL: ${file} is not valid JSON: ${e.message}`);
  process.exit(1);
}

const problems = [];
const where = (miniId, qn, short) => {
  const ln = short ? lineOf.get(`${miniId}::${short}`) : undefined;
  return `${miniId} Q${qn}${ln ? ` (line ${ln})` : ""}`;
};

function checkLatex(miniId, qn, field, text, short) {
  const label = `${where(miniId, qn, short)} [${field}]`;
  for (const m of text.matchAll(/\\\$/g))
    problems.push(
      `${label}: escaped \\$ at col ${m.index} — renderer splits on raw $, so this opens math mid-sentence; write money as $..$ (e.g. $240$)`
    );
  const dollars = [...text.matchAll(/\$/g)].length;
  if (dollars % 2 !== 0)
    problems.push(`${label}: odd $ count (${dollars}) — a $...$ segment never closes`);
  const parts = text.split("$");
  for (let i = 1; i < parts.length; i += 2) {
    const seg = parts[i];
    if (/[a-zA-Z]{3,}/.test(seg) && !/\\(text|frac|times|div|cdot|sqrt|approx|equiv|pmod|bmod|geq|leq|neq|pm|begin|end|pmatrix|bmatrix|vmatrix|langle|rangle|theta|circ|sin|cos|tan|to|infty|log|ln|dots|ldots|cdots|cdot|%|{|})|_/.test(seg))
      problems.push(`${label}: prose inside math "${seg.slice(0, 45)}..." — a $ boundary is misplaced`);
    if (/(^|[^,{\\])\d,\d{3}/.test(seg))
      problems.push(`${label}: thousands separator in math "${seg.slice(0, 35)}" — wrap as {,} (e.g. $52{,}000$); vector/coordinate commas are fine`);
  }
  if (/%/.test(text.replace(/\$[^$]*\$/g, "")))
    problems.push(`${label}: bare % outside math — use $..\\%..$`);
}

for (const ch of doc.chapters ?? []) {
  for (const m of ch.minis ?? []) {
    for (const q of m.questions ?? []) {
      const tag = where(m.id, q.n, q.short);
      if (!Array.isArray(q.options) || q.options.length !== 4) problems.push(`${tag}: needs exactly 4 options`);
      if (!"ABCD".includes(q.answer)) problems.push(`${tag}: bad answer key`);
      if (!q.statement) problems.push(`${tag}: empty statement`);
      if (typeof q.explain !== "string" || !q.explain) problems.push(`${tag}: empty explain`);
      if (q.statement) checkLatex(m.id, q.n, "statement", q.statement, q.short);
      (q.options ?? []).forEach((o, i) => checkLatex(m.id, q.n, `opt${"ABCD"[i]}`, o, q.short));
      if (q.explain) checkLatex(m.id, q.n, "explain", q.explain, q.short);
    }
    const slides = m.theory?.slides ?? (m.theory?.blocks ? [m.theory] : []);
    slides.forEach((s, i) => {
      if (!s.heading) problems.push(`${m.id} theory slide ${i + 1}: missing heading`);
      for (const b of s.blocks ?? []) {
        const txt = b.p ?? b.math ?? (b.list ?? []).join(" ");
        if (txt) checkLatex(m.id, `theory-s${i + 1}`, b.p ? "p" : b.math ? "math" : "list", txt);
      }
    });
  }
}

if (problems.length > 0) {
  console.error(`FAIL ${file}:\n - ${problems.join("\n - ")}`);
  process.exit(1);
}
const nQ = doc.chapters.reduce((a, c) => a + c.minis.reduce((x, m) => x + (m.questions ?? []).length, 0), 0);
const nMini = doc.chapters.reduce((a, c) => a + c.minis.length, 0);
console.log(`OK ${file} :: ${doc.chapters.length} chapters, ${nMini} minis, ${nQ} questions, LaTeX clean`);
