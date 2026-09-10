import { createClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const stripPrefix = (id) => {
  const parts = String(id).split(":");
  return parts.length > 1 ? parts.slice(1).join(":") : id;
};

export async function fetchCatalog() {
  if (!URL || !KEY) throw new Error("Supabase env missing at build (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)");
  const sb = createClient(URL, KEY);
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Supabase request timed out after 15s")), 15000)
  );
  const query = (async () => {
    const [t, p, q] = await Promise.all([
      sb.from("act_tests").select("*"),
      sb.from("act_passages").select("*").order("position"),
      sb.from("act_questions").select("*").order("n"),
    ]);
    if (t.error) throw t.error;
    if (p.error) throw p.error;
    if (q.error) throw q.error;
    return { t, p, q };
  })();
  const { t, p, q } = await Promise.race([query, timeout]);
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

/* Skill section: courses with skills, lesson blocks, figures, worked
   examples, and practice problems — assembled into the same shape the
   lesson JSON files use, so the viewer code is unchanged. */
export async function fetchLessons() {
  if (!URL || !KEY) throw new Error("Supabase env missing at build (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)");
  const sb = createClient(URL, KEY);
  const [c, s, b, f, e, q] = await Promise.all([
    sb.from("act_courses").select("*"),
    sb.from("act_course_skills").select("*").order("position"),
    sb.from("act_lesson_blocks").select("*").order("position"),
    sb.from("act_course_figures").select("*"),
    sb.from("act_lesson_examples").select("*").order("n"),
    sb.from("act_lesson_problems").select("*").order("n"),
  ]);
  for (const [resp, name] of [[c, "courses"], [s, "skills"], [b, "blocks"], [f, "figures"], [e, "examples"], [q, "problems"]]) {
    if (resp.error) throw new Error(`lessons/${name}: ${resp.error.message}`);
  }
  const courses = (c.data || []).map((course) => ({
    id: course.id,
    subject: course.subject,
    title: course.title,
    tier: course.tier,
    summary: course.summary,
    timeMinutes: Number(course.time_minutes),
    skills: (s.data || [])
      .filter((r) => r.course_id === course.id)
      .map((r) => ({ id: r.skill_id, title: r.title, key: r.key })),
    lesson: (b.data || [])
      .filter((r) => r.course_id === course.id)
      .map((r) => r.block),
    figures: Object.fromEntries(
      (f.data || []).filter((r) => r.course_id === course.id).map((r) => [r.fig_id, r.svg])
    ),
    examples: (e.data || [])
      .filter((r) => r.course_id === course.id)
      .map((r) => ({ n: r.n, tag: r.tag, statement: r.statement, figure: r.figure, discuss: r.discuss })),
    problems: (q.data || [])
      .filter((r) => r.course_id === course.id)
      .map((r) => ({
        n: r.n,
        tag: r.tag,
        short: r.short,
        statement: r.statement,
        figure: r.figure,
        options: r.options,
        answer: r.answer,
        explain: r.explain,
      })),
  }));
  return {
    math: { subject: "math", courses: courses.filter((t) => t.subject === "math") },
    english: { subject: "english", lessons: [], courses: courses.filter((t) => t.subject !== "math") },
  };
}

/* Chapters view: chapters with minis (theory slide + questions), ordered
   by the trailing number in each id (ch1..ch10, MATH-MINI-1-1…). */
const tailNum = (id) => {
  const m = /(\d+)(?!.*\d)/.exec(String(id));
  return m ? parseInt(m[1], 10) : 0;
};

export async function fetchChapters() {
  if (!URL || !KEY) throw new Error("Supabase env missing at build (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)");
  const sb = createClient(URL, KEY);
  const [c, m, q] = await Promise.all([
    sb.from("act_chapters").select("*"),
    sb.from("act_minis").select("*"),
    sb.from("act_mini_questions").select("*").order("n"),
  ]);
  for (const [resp, name] of [[c, "chapters"], [m, "minis"], [q, "mini_questions"]]) {
    if (resp.error) throw new Error(`chapters/${name}: ${resp.error.message}`);
  }
  const chapters = (c.data || [])
    .slice()
    .sort((a, b) => tailNum(a.id) - tailNum(b.id))
    .map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      subtitle: chapter.subtitle,
      minis: (m.data || [])
        .filter((r) => r.chapter_id === chapter.id)
        .sort((a, b) => tailNum(a.id) - tailNum(b.id) || String(a.id).localeCompare(String(b.id)))
        .map((r) => ({
          id: r.id,
          title: r.title,
          done: r.done,
          timeMinutes: Number(r.time_minutes),
          theory: r.theory,
          questions: (q.data || [])
            .filter((x) => x.mini_id === r.id)
            .map((x) => ({
              n: x.n,
              tag: x.tag,
              short: x.short,
              statement: x.statement,
              options: x.options,
              answer: x.answer,
              explain: x.explain,
            })),
        })),
    }));
  return { subject: "math", chapters };
}
