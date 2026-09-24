import "./supporters-wall.css";

const DONORS = [
  { rank: 1, name: "Sofia", amount: "$120" },
  { rank: 2, name: "Liam", amount: "$85" },
  { rank: 3, name: "You", amount: "$50", you: true },
  { rank: 4, name: "Emma", amount: "$32" },
  { rank: 5, name: "Ayan", amount: "$20" },
  { rank: 6, name: "Mira", amount: "$12" },
];

export default function SupportersWall() {
  const top = DONORS[0];
  const rest = DONORS.slice(1);
  return (
    <div className="sw-screen">
      <div className="sw-topbar" aria-hidden="true">
        <span className="sw-x">✕</span>
        <span className="sw-toptitle">SUPPORTERS WALL</span>
        <span className="sw-x-spacer" />
      </div>

      <div className="sw-spotlight rise">
        <p className="sw-ribbon">TOP SUPPORTER</p>
        <span className="sw-avatar big" aria-hidden="true" />
        <p className="sw-spot-name">{top.name}</p>
        <p className="sw-spot-amount">{top.amount}</p>
        <p className="sw-spot-note">given this month</p>
      </div>

      <div className="sw-list">
        {rest.map((d) => (
          <div className={d.you ? "sw-row you rise" : "sw-row rise"} key={d.rank}>
            <span className={`sw-rank r${d.rank}`}>{d.rank}</span>
            <span className="sw-avatar" aria-hidden="true" />
            <span className="sw-name">{d.name}</span>
            <span className="sw-amount">{d.amount}</span>
          </div>
        ))}
      </div>

      <div className="sw-foot">
        <p>Every dollar funds free practice sets for students.</p>
        <span className="sw-cta">Become a supporter</span>
      </div>
    </div>
  );
}
