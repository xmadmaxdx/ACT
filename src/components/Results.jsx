import { englishScaled, composite, formatPace } from "../scoring.js";

function ScoreRing({ value }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const frac = value / 36;
  return (
    <div className="score-ring">
      <svg width="150" height="150" viewBox="0 0 150 150" aria-hidden="true">
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

export default function Results({ session, testData, onGo, onRetake, onExit, showAdd, showCombo, onAddSection, onShowCombo }) {
  const { picks, paces } = session;
  const qs = testData.questions;
  const correct = qs.filter((q) => picks[q.n] === q.answer).length;
  const eng = englishScaled(correct, qs.length);
  const comp = composite([eng]);
  const paceVals = Object.values(paces);
  const avgPace = paceVals.length
    ? Math.round(paceVals.reduce((a, b) => a + b, 0) / paceVals.length)
    : 0;
  const missed = qs.filter((q) => picks[q.n] !== q.answer);
  const accuracy = Math.round((correct / qs.length) * 100);
  const section = (testData.section || "english").toLowerCase();
  const subj = section.charAt(0).toUpperCase() + section.slice(1);
  const others = ["English", "Math", "Reading"].filter((s) => s.toLowerCase() !== section);

  return (
    <div className="results">
      <div className="results-inner">
        <section className="results-hero rise d1">
          <ScoreRing value={comp} />
          <div className="results-hero-text">
            <p className="results-kicker">Projected Composite · {subj} only</p>
            <h1 className="results-title">You scored {correct} of {qs.length}</h1>
            <p className="results-sub">
              {subj} scaled score {eng} · Accuracy {accuracy}% · Average pace {formatPace(avgPace)} per
              question. {others.length > 0 ? `Add ${others.join(" and ")} for an official composite.` : "All sections complete."}
            </p>
          </div>
        </section>

        <section className="stat-grid rise d2">
          <div className="stat-card">
            <span className="stat-value">{eng}</span>
            <span className="stat-label">{subj} / 36</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{correct}/{qs.length}</span>
            <span className="stat-label">Correct</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{formatPace(avgPace)}</span>
            <span className="stat-label">Avg pace</span>
          </div>
          <div className="stat-card alert">
            <span className="stat-value">{missed.length}</span>
            <span className="stat-label">Missed</span>
          </div>
        </section>

        <section className="rise d3">
          <h2 className="section-title">
            Questions to review {missed.length > 0 && <span className="count-pill">{missed.length}</span>}
          </h2>
          {missed.length === 0 ? (
            <div className="perfect-box">Perfect run. Nothing to review.</div>
          ) : (
            <div className="miss-list">
              {missed.map((q) => (
                <div key={q.n} className="miss-row">
                  <span className="q-badge">{q.n}</span>
                  <span className="miss-text">
                    <span className="miss-tag">{q.tag}</span>
                    <span className="miss-picks">
                      You: <b>{picks[q.n] || "—"}</b> · Correct: <b className="good">{q.answer}</b> · Pace: {formatPace(paces[q.n])}
                    </span>
                  </span>
                  <button className="go-btn" type="button" onClick={() => onGo(q.n)}>
                    GO
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="results-actions rise d4">
          <button className="btn-primary" type="button" onClick={onRetake}>
            RETAKE TEST
          </button>
          {showAdd && (
            <button className="btn-primary" type="button" onClick={onAddSection}>
              ADD SECTION
            </button>
          )}
          {showCombo && (
            <button className="btn-primary" type="button" onClick={onShowCombo}>
              VIEW COMBO
            </button>
          )}
          <button className="action-card slim" type="button" onClick={onExit}>
            Back to practice
          </button>
        </section>
      </div>
    </div>
  );
}
