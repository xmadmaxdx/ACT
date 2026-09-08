import { useEffect, useState } from "react";
import ModeModal from "./ModeModal.jsx";
import MathText from "./MathText.jsx";

function Blocks({ blocks, figures }) {
  return (blocks || []).map((b, i) => {
    if (b.h) return <h4 key={i} className="lesson-h">{b.h}</h4>;
    if (b.math) return <div key={i} className="lesson-math"><MathText text={`$$${b.math}$$`} /></div>;
    if (b.list) {
      return (
        <ul key={i} className="lesson-list">
          {b.list.map((t, j) => (
            <li key={j}><MathText text={t} /></li>
          ))}
        </ul>
      );
    }
    if (b.figure && figures && figures[b.figure]) {
      return (
        <figure key={i} className="lesson-figure-wrap">
          <span
            className="lesson-figure"
            dangerouslySetInnerHTML={{ __html: figures[b.figure] }}
          />
          {b.caption && <figcaption>{b.caption}</figcaption>}
        </figure>
      );
    }
    return <p key={i} className="lesson-p"><MathText text={b.p || ""} /></p>;
  });
}

function lessonTest(course) {
  return {
    id: `MATH-LESSON-${course.id}`,
    title: course.title,
    total: course.problems.length,
    timeMinutes: course.timeMinutes || course.problems.length,
    figures: course.figures || {},
    passages: course.problems.map((prob) => ({
      id: `q${prob.n}`,
      title: `Problem ${prob.n}`,
      paras: [
        [
          { t: prob.statement },
          ...(prob.figure && course.figures && course.figures[prob.figure]
            ? [{ fig: prob.figure }]
            : []),
        ],
      ],
    })),
    questions: course.problems.map((prob) => ({
      n: prob.n,
      p: `q${prob.n}`,
      tag: prob.tag,
      stem: "",
      stemSide: "left",
      short: prob.short,
      options: prob.options,
      answer: prob.answer,
      explain: prob.explain,
    })),
  };
}

export default function TestInfo({ onGiveTest }) {
  const [data, setData] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [math, eng] = await Promise.all([
          import("../data/math-lessons.json"),
          import("../data/english-lessons.json"),
        ]);
        if (live) setData({ math: math.default || math, english: eng.default || eng });
      } catch (e) {
        if (live) setData({ error: String((e && e.message) || e) });
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  if (!data) {
    return (
      <div>
        <h2 className="section-title rise d2">Test info</h2>
        <p className="muted-text">Loading skills…</p>
      </div>
    );
  }

  if (data.error) {
    return (
      <div>
        <h2 className="section-title rise d2">Test info</h2>
        <p className="muted-text">Could not load lessons: {data.error}</p>
      </div>
    );
  }

  const courses = (data.math && data.math.courses) || [];
  const roadmap = (data.math && data.math.roadmap) || [];
  const englishCount = ((data.english && data.english.lessons) || []).length;

  return (
    <div>
      <h2 className="section-title rise d2">Test info</h2>
      <p className="muted-text rise d2">
        Skill courses with lessons and 10-problem practice sets. A course loads only when you open this page.
      </p>

      <h3 className="group-title rise d3">Math courses</h3>
      <div className="skill-grid rise d3">
        {courses.map((course) => {
          const open = openId === course.id;
          const ready = (course.problems || []).length > 0;
          return (
            <div key={course.id} className="course-card">
              <button
                type="button"
                className="course-head"
                onClick={() => setOpenId(open ? null : course.id)}
                aria-expanded={open}
              >
                <span className="skill-text">
                  <span className="skill-title">{course.title}</span>
                  <span className="skill-meta">
                    {course.tier} · {(course.problems || []).length} practice problems
                  </span>
                </span>
                <span className="course-caret" aria-hidden="true">{open ? "▾" : "▸"}</span>
              </button>
              {open && (
                <div className="course-body">
                  <p className="lesson-p">{course.summary}</p>
                  <h4 className="lesson-h">Skills in this course</h4>
                  <ul className="lesson-list">
                    {(course.skills || []).map((s) => (
                      <li key={s.id}>
                        <strong>{s.title}:</strong> <MathText text={s.key} />
                      </li>
                    ))}
                  </ul>
                  <Blocks blocks={course.lesson} figures={course.figures} />
                  <button
                    type="button"
                    className="btn-primary course-cta"
                    disabled={!ready}
                    onClick={() =>
                      ready &&
                      setSelected({
                        id: `MATH-LESSON-${course.id}`,
                        title: course.title,
                        meta: `${course.problems.length} questions · ${course.timeMinutes || course.problems.length} min`,
                        course,
                      })
                    }
                  >
                    {ready ? "GIVE TEST" : "COMING SOON"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {roadmap.length > 0 && (
        <>
          <h3 className="group-title">Roadmap</h3>
          <div className="skill-grid">
            {roadmap.map((r) => (
              <div key={r.title} className="course-card locked">
                <span className="skill-text">
                  <span className="skill-title">{r.title}</span>
                  <span className="skill-meta">{r.tier} · coming soon</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 className="group-title">English lessons</h3>
      <p className="muted-text">
        {englishCount === 0 ? "English lessons are coming soon." : `${englishCount} lessons available.`}
      </p>

      {selected && (
        <ModeModal
          skill={selected}
          onClose={() => setSelected(null)}
          onStart={(mode) => onGiveTest(lessonTest(selected.course), mode)}
        />
      )}
    </div>
  );
}
