import { DumbbellIcon, CalculatorIcon } from "./icons.jsx";

export default function ActionCards({ onPractice, onCalculator }) {
  return (
    <div className="action-cards rise d4">
      <button className="action-card" type="button" onClick={onPractice}>
        <DumbbellIcon />
        <span>Practice free</span>
      </button>
      <button className="action-card" type="button" onClick={onCalculator}>
        <CalculatorIcon />
        <span>Open calculator</span>
      </button>
    </div>
  );
}
