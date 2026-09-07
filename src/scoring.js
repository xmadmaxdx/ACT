/* Scoring helpers. English scale is a straight stretch of the Form J08
   40-question table to our 50-question tests: raw40 = round(raw50 * 0.8),
   then a linear 40->36 ... 0->1 map. Swap ENGLISH_40 for the exact
   table any time without touching components. */

export function englishScaled(correct, total) {
  const raw40 = Math.round((correct / total) * 40);
  return Math.min(36, Math.max(1, Math.round((raw40 / 40) * 35) + 1));
}

export function composite(scores) {
  const vals = scores.filter((v) => v !== null && v !== undefined);
  if (vals.length === 0) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export function formatPace(sec) {
  if (sec === null || sec === undefined) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
