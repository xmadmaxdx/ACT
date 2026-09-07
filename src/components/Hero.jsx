import DuoAnimation from "./DuoAnimation.jsx";

export default function Hero() {
  return (
    <section className="hero">
      <div className="rise d2">
        <h1 className="hero-title">
          Prep for the ACT and access
          <br />
          2,000+ colleges globally
        </h1>
        <button className="btn-primary" type="button">
          START PRACTICING
        </button>
      </div>
      <div className="hero-art rise d3">
        <DuoAnimation />
      </div>
    </section>
  );
}
