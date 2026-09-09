import { useEffect, useState } from "react";

function miniTest(mini) {
  return {
    id: mini.id,
    title: mini.title,
    section: "math",
    total: mini.questions.length,
    timeMinutes: mini.timeMinutes || 10,
    intro: mini.theory || null,
    figures: {},
    passages: mini.questions.map((q) => ({
      id: `q${q.n}`,
      title: `Problem ${q.n}`,
      paras: [[{ t: q.statement }]],
    })),
    questions: mini.questions.map((q) => ({
      n: q.n,
      p: `q${q.n}`,
      tag: q.tag,
      stem: "",
      stemSide: "left",
      short: q.short,
      options: q.options,
      answer: q.answer,
      explain: q.explain,
    })),
  };
}

export default function Chapters({ onStartMini }) {
  const [data, setData] = useState(null);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { fetchChapters } = await import("../supabase.js");
        const data = await fetchChapters();
        if (live) {
          console.info(
            `ACTprep chapters source: supabase (${data.chapters.length} chapters)`
          );
          setData(data);
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
        <h2 className="section-title rise d2">Chapters</h2>
        <p className="muted-text">Loading chapters…</p>
      </div>
    );
  }

  if (data.error) {
    return (
      <div>
        <h2 className="section-title rise d2">Chapters</h2>
        <p className="muted-text">Could not load chapters: {data.error}</p>
      </div>
    );
  }

  const chapters = data.chapters || [];

  return (
    <div>
      <h2 className="section-title rise d2">Math chapters</h2>
      <p className="muted-text rise d2">
        Ten chapters, topic by topic. Open a chapter, pick a mini-chapter, read the note slide, then take the 10-question exam.
      </p>
      <div className="chapter-list rise d3">
        {chapters.map((ch, ci) => {
          const open = openId === ch.id;
          const doneCount = (ch.minis || []).filter((m) => m.done).length;
          return (
            <div key={ch.id} className="course-card">
              <button
                type="button"
                className="course-head"
                onClick={() => setOpenId(open ? null : ch.id)}
                aria-expanded={open}
              >
                <span className="skill-text">
                  <span className="skill-title">
                    {ci + 1}. {ch.title}
                  </span>
                  <span className="skill-meta">
                    {ch.subtitle} · {doneCount}/{(ch.minis || []).length} ready
                  </span>
                </span>
                <span className="course-caret" aria-hidden="true">{open ? "▾" : "▸"}</span>
              </button>
              {open && (
                <div className="course-body">
                  {(ch.minis || []).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={m.done ? "mini-row" : "mini-row locked"}
                      disabled={!m.done}
                      onClick={() => m.done && onStartMini(miniTest(m), "untimed")}
                    >
                      <span className="skill-text">
                        <span className="skill-title mini-title">{m.title}</span>
                        <span className="skill-meta">
                          {m.done ? `${m.questions.length} questions · START` : "coming soon"}
                        </span>
                      </span>
                      <span className="course-caret" aria-hidden="true">{m.done ? "▸" : "·"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
