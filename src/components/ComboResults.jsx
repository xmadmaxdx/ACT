import { englishScaled, composite, formatPace } from "../scoring.js";

function MiniRing({ value }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const frac = Math.min(1, Math.max(0, value / 36));
  return (
    <div className="score-ring small">
      <svg width="110" height="110" viewBox="0 0 150 150" aria-hidden="true">
        <circle cx="75" cy="75" r={r} fill="none" stroke="#e5e5e5" strokeWidth="13" />
        <circle
          cx="75"
          cy="75"
          r={r}
          fill="none"
          stroke="#58cc02"
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          transform="rotate(-90 75 75)"
          className="ring-anim"
        />
      </svg>
      <div className="ring-center">
        <span className="ring-value">{value}</span>
        <span className="ring-max">/ 36</span>
      </div>
    </div>
  );
}

function runStats(run) {
  const qs = run.testData.questions;
  const correct = qs.filter((q) => run.session.picks[q.n] === q.answer).length;
  const scaled = englishScaled(correct, qs.length);
  const paceVals = Object.values(run.session.paces || {});
  const avgPace = paceVals.length
    ? Math.round(paceVals.reduce((a, b) => a + b, 0) / paceVals.length)
    : 0;
  const missed = qs.filter((q) => run.session.picks[q.n] !== q.answer);
  const section = (run.testData.section || "english").toLowerCase();
  const subj = section.charAt(0).toUpperCase() + section.slice(1);
  return { qs, correct, scaled, avgPace, missed, subj, accuracy: Math.round((correct / qs.length) * 100) };
}

export default function ComboResults({ runs, onGo, onRetakeRun, onExit, onAddSection }) {
  const stats = runs.map(runStats);
  const comp = composite(stats.map((s) => s.scaled));

  return (
    <div className="results">
      <div className="results-inner">
        <section className="results-hero rise d1">
          <MiniRing value={comp} />
          <div className="results-hero-text">
            <p className="results-kicker">
              Composite · {stats.map((s) => s.subj).join(" + ")}
            </p>
            <h1 className="results-title">Composite {comp}</h1>
            <p className="results-sub">
              {stats.map((s) => `${s.subj} ${s.scaled}`).join(" · ")} averaged and rounded.
            </p>
          </div>
        </section>

        {stats.map((s, i) => (
          <section className="rise d2" key={runs[i].skill.id + i}>
            <h2 className="section-title">
              {s.subj} — {s.scaled}/36
              {s.missed.length > 0 && <span className="count-pill">{s.missed.length}</span>}
            </h2>
            <div className="stat-grid">
              <div className="stat-card">
                <span className="stat-value">{s.correct}/{s.qs.length}</span>
                <span className="stat-label">Correct</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{s.accuracy}%</span>
                <span className="stat-label">Accuracy</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{formatPace(s.avgPace)}</span>
                <span className="stat-label">Avg pace</span>
              </div>
              <div className="stat-card">
                <button type="button" className="footer-link" onClick={() => onRetakeRun(i)}>
                  RETAKE
                </button>
              </div>
            </div>
            {s.missed.length > 0 && (
              <div className="miss-list">
                {s.missed.map((q) => (
                  <div key={q.n} className="miss-row">
                    <span className="q-badge">{q.n}</span>
                    <span className="miss-text">
                      <span className="miss-tag">{q.tag}</span>
                      <span className="miss-picks">
                        You: <b>{runs[i].session.picks[q.n] || "—"}</b> · Correct:{" "}
                        <b className="good">{q.answer}</b> · Pace: {formatPace(runs[i].session.paces?.[q.n])}
                      </span>
                    </span>
                    <button className="go-btn" type="button" onClick={() => onGo(i, q.n)}>
                      GO
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        <section className="results-actions rise d4">
          {stats.length < 2 && (
            <button type="button" className="btn-primary" onClick={onAddSection}>
              ADD SECTION
            </button>
          )}
          <button className="action-card slim" type="button" onClick={onExit}>
            Back to home
          </button>
        </section>
      </div>
    </div>
  );
}
