import "./leaderboard.css";

const WEEK = [
  { rank: 1, name: "Maya", xp: "2,450 XP", streak: 9 },
  { rank: 2, name: "Leo", xp: "2,310 XP", streak: 14 },
  { rank: 3, name: "You", xp: "2,180 XP", streak: 6, you: true },
  { rank: 4, name: "Ava", xp: "1,990 XP", streak: 11 },
  { rank: 5, name: "Noah", xp: "1,875 XP", streak: 4 },
  { rank: 6, name: "Zoe", xp: "1,640 XP", streak: 7 },
];

const ALLTIME = [
  { rank: 1, name: "Leo", xp: "48,200 XP", streak: 31 },
  { rank: 2, name: "Maya", xp: "45,910 XP", streak: 22 },
  { rank: 3, name: "Ava", xp: "41,300 XP", streak: 18 },
  { rank: 4, name: "You", xp: "38,760 XP", streak: 6, you: true },
  { rank: 5, name: "Zoe", xp: "33,120 XP", streak: 15 },
  { rank: 6, name: "Noah", xp: "29,480 XP", streak: 9 },
];

function Flame() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 1.5c.8 3-1.2 4.3-1.2 6.5a3.4 3.4 0 0 0 6.8.4c0-1-.4-1.9-1-2.7.1 1.2-.5 1.7-1 2.2.3-2.3-.9-5-3.6-6.4z"
        fill="#f5c044"
        stroke="#b25e09"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Crown() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 8l3.5 3L12 5l5.5 6L21 8l-1.6 8.5H4.6z"
        fill="#f5c044"
        stroke="#b25e09"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Leaderboard({ tab }) {
  const week = tab !== "all";
  const rows = week ? WEEK : ALLTIME;
  const [first, second, third, ...rest] = rows;
  const order = [second, first, third];
  const you = rows.find((r) => r.you);
  return (
    <div className="lb-screen">
      <div className="lb-topbar" aria-hidden="true">
        <span className="lb-toptitle">LEADERBOARD</span>
      </div>
      <p className="lb-refresh">REFRESHES IN 3D 5H 16M</p>
      <div className="lb-tabs" aria-hidden="true">
        <span className={week ? "lb-tab on" : "lb-tab"}>7 Days XP</span>
        <span className={week ? "lb-tab" : "lb-tab on"}>All Time</span>
      </div>

      <div className="lb-podium">
        {order.map((r) => (
          <div className={r.rank === 1 ? "lb-step first rise" : "lb-step rise"} key={r.rank}>
            {r.rank === 1 ? <Crown /> : null}
            <span className="lb-avatar" aria-hidden="true" />
            <span className="lb-pname">{r.name}</span>
            {week ? (
              <span className="lb-pxp">{r.xp}</span>
            ) : null}
            <span className="lb-streak">
              <Flame /> {r.streak}
            </span>
          </div>
        ))}
      </div>

      <div className="lb-list">
        {rest.map((r) => (
          <div className={r.you ? "lb-row you rise" : "lb-row rise"} key={r.rank}>
            <span className="lb-pos">{r.rank}</span>
            <span className="lb-avatar sm" aria-hidden="true" />
            <span className="lb-rname">{r.name}</span>
            {week ? (
              <>
                <span className="lb-streak">
                  <Flame /> {r.streak}
                </span>
                <span className="lb-rxp">{r.xp}</span>
              </>
            ) : (
              <span className="lb-streak big">
                <Flame /> {r.streak}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="lb-you-strip">
        <div className="lb-you">
          <span className="lb-pos">#{you.rank}</span>
          <span className="lb-avatar sm" aria-hidden="true" />
          <span className="lb-rname">YOU</span>
          {week ? (
            <span className="lb-rxp">{you.xp}</span>
          ) : (
            <span className="lb-streak big">
              <Flame /> {you.streak}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
