import { DumbbellIcon, ListIcon } from "./icons.jsx";

export default function ActionCards({ onPractice }) {
  return (
    <div className="action-cards rise d4">
      <button className="action-card" type="button" onClick={onPractice}>
        <DumbbellIcon />
        <span>Practice free</span>
      </button>
      <button className="action-card" type="button">
        <ListIcon />
        <span>Learn about the test</span>
      </button>
    </div>
  );
}
