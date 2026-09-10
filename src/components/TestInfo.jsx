import { useEffect, useState } from "react";
import ModeModal from "./ModeModal.jsx";
import MathText from "./MathText.jsx";

function PracticeEmbed({ problem, figures }) {
  const [pick, setPick] = useState(null);
  const [checked, setChecked] = useState(false);
  if (!problem) return null;
  const correct = pick === problem.answer;
  return (
    <div className="embed-q">
      <div className="embed-q-head">
        <span className="q-badge sm">Q{problem.n}</span>
        <span className="q-tag">{problem.tag}</span>
      </div>
      <p className="lesson-p"><MathText text={problem.statement} /></p>
      {problem.figure && figures && figures[problem.figure] && (
        <span className="lesson-figure" dangerouslySetInnerHTML={{ __html: figures[problem.figure] }} />
      )}
      <div className="q-options">
        {problem.options.map((opt, i) => {
          const letter = ["A", "B", "C", "D"][i];
          const cls = ["q-option"];
          if (pick === letter) cls.push("selected");
          if (checked && letter === problem.answer) cls.push("correct");
          if (checked && pick === letter && letter !== problem.answer) cls.push("wrong");
          return (
            <button
              key={letter}
              type="button"
              className={cls.join(" ")}
              disabled={checked}
              onClick={() => setPick(letter)}
            >
              <span className="q-letter">{letter}</span>
              <span className="q-text"><MathText text={opt} /></span>
            </button>
          );
        })}
      </div>
      {!checked ? (
        <button
          type="button"
          className="btn-primary embed-check"
          disabled={!pick}
          onClick={() => setChecked(true)}
        >
          CHECK
        </button>
      ) : (
        <div className={correct ? "explain ok" : "explain no"}>
          <span className="explain-head">
            {correct ? "Correct" : `Correct answer: ${problem.answer}`}
          </span>
          <p className="explain-text"><MathText text={problem.explain} /></p>
          <button
            type="button"
            className="flag-btn"
            onClick={() => {
              setPick(null);
              setChecked(false);
            }}
          >
            <span>Try again</span>
          </button>
        </div>
      )}
    </div>
  );
}

function ExampleEmbed({ example, figures }) {
  if (!example) return null;
  return (
    <div className="example-q">
      <div className="embed-q-head">
        <span className="q-badge sm">Ex {example.n}</span>
        <span className="q-tag">{example.tag}</span>
      </div>
      <p className="lesson-p"><MathText text={example.statement} /></p>
      {example.figure && figures && figures[example.figure] && (
        <span className="lesson-figure" dangerouslySetInnerHTML={{ __html: figures[example.figure] }} />
      )}
      <div className="example-discuss">
        <span className="explain-head">Walkthrough</span>
        <p className="explain-text"><MathText text={example.discuss} /></p>
      </div>
    </div>
  );
}

function Blocks({ blocks, course }) {
  const figures = (course && course.figures) || {};
  const byNum = {};
  ((course && course.problems) || []).forEach((p) => {
    byNum[p.n] = p;
  });
  const exByNum = {};
  ((course && course.examples) || []).forEach((e) => {
    exByNum[e.n] = e;
  });
  return (blocks || []).map((b, i) => {
    if (b.h) return <h4 key={i} id={b.id} className="lesson-h scroll-anchor">{b.h}</h4>;
    if (b.practice) {
      return (
        <div key={i} className="embed-group">
          {b.practice.map((n) => (
            <PracticeEmbed key={n} problem={byNum[n]} figures={figures} />
          ))}
        </div>
      );
    }
    if (b.example !== undefined) {
      return <ExampleEmbed key={i} example={exByNum[b.example]} figures={figures} />;
    }
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

function lessonTest(course, subject) {
  return {
    id: `MATH-LESSON-${course.id}`,
    title: course.title,
    section: subject || "math",
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

function CourseGrid({ list, onOpen }) {
  return (
    <div className="skill-grid rise d3">
      {list.map((course) => {
        const ready = (course.problems || []).length > 0;
        return (
          <button
            key={course.id}
            type="button"
            className="course-card course-link"
            onClick={() => {
              onOpen(course.id);
              window.scrollTo(0, 0);
            }}
          >
            <span className="skill-text">
              <span className="skill-title">{course.title}</span>
              <span className="skill-meta">
                {course.tier} · {(course.problems || []).length} practice problems{ready ? "" : " · soon"}
              </span>
            </span>
            <span className="course-caret" aria-hidden="true">▸</span>
          </button>
        );
      })}
    </div>
  );
}

function CoursePage({ course, subject, onBack, onSelect }) {
  const ready = (course.problems || []).length > 0;
  const toc = (course.lesson || []).filter((b) => b.h && b.id);
  const go = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const payload = {
    id: `MATH-LESSON-${course.id}`,
    title: course.title,
    meta: `${course.problems.length} questions · ${course.timeMinutes || course.problems.length} min`,
    course,
    subject,
  };
  return (
    <div className="rise d3">
      <button type="button" className="flag-btn" onClick={onBack}>
        <span>← All courses</span>
      </button>
      <h3 className="course-title">{course.title}</h3>
      <p className="muted-text">
        {course.tier} · {course.problems.length} practice problems · {course.timeMinutes || course.problems.length} min test
      </p>
      <button
        type="button"
        className="btn-primary course-cta"
        disabled={!ready}
        onClick={() => ready && onSelect(payload)}
      >
        {ready ? "GIVE TEST" : "COMING SOON"}
      </button>
      <div className="course-layout">
        <div className="course-main">
          <p className="lesson-p">{course.summary}</p>
          <h4 className="lesson-h scroll-anchor" id="skills">Skills in this course</h4>
          <ul className="lesson-list">
            {(course.skills || []).map((s) => (
              <li key={s.id}>
                <strong>{s.title}:</strong> <MathText text={s.key} />
              </li>
            ))}
          </ul>
          <Blocks blocks={course.lesson} course={course} />
          <button
            type="button"
            className="btn-primary course-cta"
            disabled={!ready}
            onClick={() => ready && onSelect(payload)}
          >
            {ready ? "GIVE TEST" : "COMING SOON"}
          </button>
        </div>
        <aside className="toc" aria-label="Course contents">
          <p className="toc-title">Contents</p>
          <button type="button" className="toc-link" onClick={() => go("skills")}>
            Skills
          </button>
          {toc.map((b) => (
            <button key={b.id} type="button" className="toc-link" onClick={() => go(b.id)}>
              {b.h}
            </button>
          ))}
        </aside>
      </div>
    </div>
  );
}

export default function TestInfo({ onGiveTest, onCourseOpen }) {
  const [data, setData] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (onCourseOpen) onCourseOpen(openId !== null);
    return () => {
      if (onCourseOpen) onCourseOpen(false);
    };
  }, [openId, onCourseOpen]);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { fetchLessons } = await import("../supabase.js");
        const lessons = await fetchLessons();
        if (live) {
          console.info(
            `ACTprep lessons source: supabase (${lessons.math.courses.length} courses)`
          );
          setData(lessons);
        }
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
  const englishCourses = (data.english && data.english.courses) || [];
  const englishCount = ((data.english && data.english.lessons) || []).length;
  const openCourse = courses.concat(englishCourses).find((c) => c.id === openId) || null;

  return (
    <div>
      <h2 className="section-title rise d2">Test info</h2>
      <p className="muted-text rise d2">
        Skill courses with lessons and 10-problem practice sets. A course loads only when you open this page.
      </p>

      {!openCourse ? (
        <>
          <h3 className="group-title rise d3">Math courses</h3>
          <CourseGrid list={courses} onOpen={setOpenId} />
        </>
      ) : (
        <CoursePage
          course={openCourse}
          subject={openCourse.subject || (data.math && data.math.subject) || "math"}
          onBack={() => {
            setOpenId(null);
            window.scrollTo(0, 0);
          }}
          onSelect={(sel) => setSelected(sel)}
        />
      )}

      {!openCourse && (
        <>
          <h3 className="group-title">English lessons</h3>
          {englishCourses.length > 0 ? (
            <CourseGrid list={englishCourses} onOpen={setOpenId} />
          ) : (
            <p className="muted-text">
              {englishCount === 0 ? "English lessons are coming soon." : `${englishCount} lessons available.`}
            </p>
          )}
        </>
      )}

      {selected && (
        <ModeModal
          skill={selected}
          onClose={() => setSelected(null)}
          onStart={(mode) => onGiveTest(lessonTest(selected.course, selected.subject), mode)}
        />
      )}
    </div>
  );
}
