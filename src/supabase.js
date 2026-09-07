import { createClient } from "@supabase/supabase-js";
import englishData from "./data/english-tests.json";
import passageData from "./data/english-passages.json";

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/* Bundled fallback — the live site reads from Supabase; JSON only
   matters if the network/database is unreachable. */
export function localCatalog() {
  const section = passageData.section || "english";
  return [
    ...englishData.tests,
    ...passageData.tests.map((t) => ({ ...t, section })),
  ];
}

const stripPrefix = (id) => {
  const parts = String(id).split(":");
  return parts.length > 1 ? parts.slice(1).join(":") : id;
};

export async function fetchCatalog() {
  if (!URL || !KEY) throw new Error("Supabase env missing");
  const sb = createClient(URL, KEY);
  const [t, p, q] = await Promise.all([
    sb.from("act_tests").select("*"),
    sb.from("act_passages").select("*").order("position"),
    sb.from("act_questions").select("*").order("n"),
  ]);
  if (t.error) throw t.error;
  if (p.error) throw p.error;
  if (q.error) throw q.error;
  return (t.data || []).map((test) => ({
    id: test.id,
    section: test.section,
    title: test.title,
    total: test.total,
    timeMinutes: Number(test.time_minutes),
    passages: (p.data || [])
      .filter((r) => r.test_id === test.id)
      .map((r) => ({ id: stripPrefix(r.id), title: r.title, paras: r.paras })),
    questions: (q.data || [])
      .filter((r) => r.test_id === test.id)
      .map((r) => ({
        n: r.n,
        p: stripPrefix(r.passage_id),
        point: r.point,
        tag: r.tag,
        stem: r.stem,
        options: r.options,
        answer: r.answer,
        explain: r.explain,
      })),
  }));
}
