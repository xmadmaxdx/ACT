import MathText from "./MathText.jsx";
import {
  FIGURE_KINDS,
  MATHFIG_W,
  MATHFIG_H,
  MATHFIG_MARGIN,
  niceTicks,
  linMap,
  polarToCartesian,
  validateFigure,
} from "../mathFigures.js";

const PALETTE = ["#1cb0f6", "#58cc02", "#7b61b8", "#f5c044", "#e5484d", "#84d8ff"];

function Frame({ title, children, height }) {
  return (
    <figure className="mathfig" role="img" aria-label={title || "Math figure"}>
      {title ? <figcaption className="mathfig-cap">{title}</figcaption> : null}
      <svg
        className="mathfig-svg"
        viewBox={`0 0 ${MATHFIG_W} ${height || MATHFIG_H}`}
        aria-hidden="true"
      >
        {children}
      </svg>
    </figure>
  );
}

function Axes({ ticks, tmin, tmax, yTicks, ytmin, ytmax, xLabels, yLabel }) {
  const m = MATHFIG_MARGIN;
  const iw = MATHFIG_W - m.l - m.r;
  const ih = MATHFIG_H - m.t - m.b;
  const x = (v) => linMap(v, tmin, tmax, m.l, m.l + iw);
  const y = (v) => linMap(v, ytmin, ytmax, m.t + ih, m.t);
  return (
    <g>
      {yTicks.ticks.map((t) => (
        <g key={`g${t}`}>
          <line x1={m.l} y1={y(t)} x2={m.l + iw} y2={y(t)} className="mathfig-grid" />
          <text x={m.l - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="mathfig-tick">
            {t}
          </text>
        </g>
      ))}
      {ticks.map((t, i) => (
        <text
          key={`x${i}`}
          x={x(t.v)}
          y={m.t + ih + 18}
          textAnchor="middle"
          className="mathfig-tick"
        >
          {t.label}
        </text>
      ))}
      <line x1={m.l} y1={m.t} x2={m.l} y2={m.t + ih} className="mathfig-axis" />
      <line x1={m.l} y1={m.t + ih} x2={m.l + iw} y2={m.t + ih} className="mathfig-axis" />
      {yLabel ? (
        <text x={12} y={m.t + 4} textAnchor="start" className="mathfig-alabel">
          {yLabel}
        </text>
      ) : null}
      {xLabels}
    </g>
  );
}

function BarFig({ fig }) {
  const m = MATHFIG_MARGIN;
  const iw = MATHFIG_W - m.l - m.r;
  const ih = MATHFIG_H - m.t - m.b;
  const maxV = Math.max(...fig.values);
  const top = fig.yMax !== undefined ? fig.yMax : Math.max(maxV * 1.15, maxV + 1);
  const yt = niceTicks(0, top, 5) || { ticks: [0, top], tmin: 0, tmax: top };
  const y = (v) => linMap(v, yt.tmin, yt.tmax, m.t + ih, m.t);
  const n = fig.values.length;
  const band = iw / n;
  const w = band * 0.62;
  return (
    <Frame title={fig.title}>
      <Axes
        ticks={fig.categories.map((c, i) => ({ v: 0, label: "" }))}
        tmin={0}
        tmax={1}
        yTicks={yt}
        ytmin={yt.tmin}
        ytmax={yt.tmax}
        yLabel={fig.yLabel}
        xLabels={null}
      />
      {fig.values.map((v, i) => {
        const cx = m.l + band * i + band / 2;
        return (
          <g key={i}>
            <rect
              x={cx - w / 2}
              y={y(v)}
              width={w}
              height={Math.max(0, m.t + ih - y(v))}
              className="mathfig-bar"
              rx={3}
            />
            <text x={cx} y={y(v) - 7} textAnchor="middle" className="mathfig-val">
              {v}
            </text>
            <text x={cx} y={m.t + ih + 18} textAnchor="middle" className="mathfig-tick">
              {fig.categories[i]}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}

function HistogramFig({ fig }) {
  const m = MATHFIG_MARGIN;
  const iw = MATHFIG_W - m.l - m.r;
  const ih = MATHFIG_H - m.t - m.b;
  const maxC = Math.max(...fig.bins.map((b) => b.count));
  const yt = niceTicks(0, Math.max(maxC * 1.15, maxC + 1), 5) || {
    ticks: [0, maxC],
    tmin: 0,
    tmax: maxC,
  };
  const y = (v) => linMap(v, yt.tmin, yt.tmax, m.t + ih, m.t);
  const n = fig.bins.length;
  const band = iw / n;
  const rotate = n > 5;
  return (
    <Frame title={fig.title}>
      <Axes
        ticks={[]}
        tmin={0}
        tmax={1}
        yTicks={yt}
        ytmin={yt.tmin}
        ytmax={yt.tmax}
        yLabel={fig.yLabel || "Count"}
        xLabels={null}
      />
      {fig.bins.map((b, i) => {
        const bx = m.l + band * i;
        return (
          <g key={i}>
            <rect
              x={bx + 1}
              y={y(b.count)}
              width={Math.max(1, band - 2)}
              height={Math.max(0, m.t + ih - y(b.count))}
              className="mathfig-hist"
            />
            <text x={bx + band / 2} y={y(b.count) - 7} textAnchor="middle" className="mathfig-val">
              {b.count}
            </text>
            <text
              x={bx + band / 2}
              y={m.t + ih + (rotate ? 10 : 18)}
              textAnchor={rotate ? "end" : "middle"}
              className="mathfig-tick"
              transform={rotate ? `rotate(-35 ${bx + band / 2} ${m.t + ih + 10})` : undefined}
            >
              {`${b.lo}–${b.hi}`}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}

function LineFig({ fig }) {
  const m = MATHFIG_MARGIN;
  const iw = MATHFIG_W - m.l - m.r;
  const ih = MATHFIG_H - m.t - m.b;
  const ys = fig.points.map((p) => p.y);
  const yt = niceTicks(Math.min(...ys), Math.max(...ys), 5) || {
    ticks: ys,
    tmin: Math.min(...ys),
    tmax: Math.max(...ys),
  };
  const y = (v) => linMap(v, yt.tmin, yt.tmax, m.t + ih, m.t);
  const n = fig.points.length;
  const x = (i) => (n === 1 ? m.l + iw / 2 : m.l + (i / (n - 1)) * iw);
  const pts = fig.points.map((p, i) => `${x(i)},${y(p.y)}`).join(" ");
  return (
    <Frame title={fig.title}>
      <Axes
        ticks={[]}
        tmin={0}
        tmax={1}
        yTicks={yt}
        ytmin={yt.tmin}
        ytmax={yt.tmax}
        yLabel={fig.yLabel}
        xLabels={null}
      />
      <polyline points={pts} fill="none" className="mathfig-line" strokeWidth={2.5} />
      {fig.points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.y)} r={4} className="mathfig-dot" />
          <text x={x(i)} y={y(p.y) - 10} textAnchor="middle" className="mathfig-val">
            {p.y}
          </text>
          <text x={x(i)} y={m.t + ih + 18} textAnchor="middle" className="mathfig-tick">
            {p.x}
          </text>
        </g>
      ))}
    </Frame>
  );
}

function ScatterFig({ fig }) {
  const m = MATHFIG_MARGIN;
  const iw = MATHFIG_W - m.l - m.r;
  const ih = MATHFIG_H - m.t - m.b;
  const xs = fig.points.map((p) => p.x);
  const ys = fig.points.map((p) => p.y);
  const xt = niceTicks(Math.min(...xs), Math.max(...xs), 6) || { ticks: xs, tmin: Math.min(...xs), tmax: Math.max(...xs) };
  const yt = niceTicks(Math.min(...ys), Math.max(...ys), 5) || { ticks: ys, tmin: Math.min(...ys), tmax: Math.max(...ys) };
  const x = (v) => linMap(v, xt.tmin, xt.tmax, m.l, m.l + iw);
  const y = (v) => linMap(v, yt.tmin, yt.tmax, m.t + ih, m.t);
  return (
    <Frame title={fig.title}>
      <g>
        {yt.ticks.map((t) => (
          <g key={`g${t}`}>
            <line x1={m.l} y1={y(t)} x2={m.l + iw} y2={y(t)} className="mathfig-grid" />
            <text x={m.l - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="mathfig-tick">
              {t}
            </text>
          </g>
        ))}
        {xt.ticks.map((t) => (
          <text key={`x${t}`} x={x(t)} y={m.t + ih + 18} textAnchor="middle" className="mathfig-tick">
            {t}
          </text>
        ))}
        <line x1={m.l} y1={m.t} x2={m.l} y2={m.t + ih} className="mathfig-axis" />
        <line x1={m.l} y1={m.t + ih} x2={m.l + iw} y2={m.t + ih} className="mathfig-axis" />
        {fig.xLabel ? (
          <text x={m.l + iw} y={m.t + ih + 32} textAnchor="end" className="mathfig-alabel">
            {fig.xLabel}
          </text>
        ) : null}
        {fig.yLabel ? (
          <text x={12} y={m.t + 4} textAnchor="start" className="mathfig-alabel">
            {fig.yLabel}
          </text>
        ) : null}
      </g>
      {fig.trend ? (
        <line
          x1={x(xt.tmin)}
          y1={y(fig.trend.slope * xt.tmin + fig.trend.intercept)}
          x2={x(xt.tmax)}
          y2={y(fig.trend.slope * xt.tmax + fig.trend.intercept)}
          className="mathfig-trend"
        />
      ) : null}
      {fig.points.map((p, i) => (
        <circle key={i} cx={x(p.x)} cy={y(p.y)} r={4.5} className="mathfig-dot" />
      ))}
    </Frame>
  );
}

function PieFig({ fig }) {
  const W = 300;
  const H = 250;
  const cx = 120;
  const cy = 125;
  const r = 85;
  const total = fig.slices.reduce((a, s) => a + s.value, 0);
  let acc = 0;
  const arcs = fig.slices.map((s, i) => {
    const start = (acc / total) * 360;
    acc += s.value;
    const end = (acc / total) * 360;
    const p1 = polarToCartesian(cx, cy, r, start);
    const p2 = polarToCartesian(cx, cy, r, end);
    const large = end - start > 180 ? 1 : 0;
    const pct = Math.round((s.value / total) * 100);
    return { s, i, start, end, p1, p2, large, pct };
  });
  return (
    <figure className="mathfig" role="img" aria-label={fig.title || "Pie chart"}>
      {fig.title ? <figcaption className="mathfig-cap">{fig.title}</figcaption> : null}
      <svg className="mathfig-svg pie" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        {arcs.map((a) => (
          <path
            key={a.i}
            d={`M ${cx} ${cy} L ${a.p1.x} ${a.p1.y} A ${r} ${r} 0 ${a.large} 1 ${a.p2.x} ${a.p2.y} Z`}
            fill={PALETTE[a.i % PALETTE.length]}
            stroke="#fff"
            strokeWidth={2}
          />
        ))}
        {arcs.map((a) => {
          const mid = (a.start + a.end) / 2;
          if (a.end - a.start >= 32) {
            const c = polarToCartesian(cx, cy, r * 0.62, mid);
            return (
              <text key={`t${a.i}`} x={c.x} y={c.y} textAnchor="middle" dominantBaseline="middle" className="mathfig-pielabel">
                {`${a.pct}%`}
              </text>
            );
          }
          const o1 = polarToCartesian(cx, cy, r + 4, mid);
          const o2 = polarToCartesian(cx, cy, r + 22, mid);
          return (
            <g key={`t${a.i}`}>
              <line x1={o1.x} y1={o1.y} x2={o2.x} y2={o2.y} className="mathfig-leader" />
              <text
                x={o2.x + (o2.x >= cx ? 5 : -5)}
                y={o2.y}
                textAnchor={o2.x >= cx ? "start" : "end"}
                dominantBaseline="middle"
                className="mathfig-tick"
              >
                {`${a.s.label} ${a.pct}%`}
              </text>
            </g>
          );
        })}
        {fig.slices.map((s, i) => (
          <g key={`l${i}`}>
            <rect x={222} y={40 + i * 22} width={12} height={12} rx={3} fill={PALETTE[i % PALETTE.length]} />
            <text x={239} y={50 + i * 22} className="mathfig-tick">
              {s.label}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}

function NumberlineFig({ fig }) {
  const W = MATHFIG_W;
  const H = 120;
  const l = 30;
  const r = W - 30;
  const midY = 62;
  const x = (v) => linMap(v, fig.min, fig.max, l, r);
  const marks = Array.from(new Set([fig.min, fig.max, ...(fig.marks || [])])).sort((a, b) => a - b);
  const h = fig.highlight;
  return (
    <figure className="mathfig" role="img" aria-label={fig.title || "Number line"}>
      {fig.title ? <figcaption className="mathfig-cap">{fig.title}</figcaption> : null}
      <svg className="mathfig-svg" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <line x1={l - 12} y1={midY} x2={r + 12} y2={midY} className="mathfig-axis" strokeWidth={2} />
        <polygon points={`${l - 12},${midY} ${l - 2},${midY - 6} ${l - 2},${midY + 6}`} className="mathfig-arrow" />
        <polygon points={`${r + 12},${midY} ${r + 2},${midY - 6} ${r + 2},${midY + 6}`} className="mathfig-arrow" />
        {h ? (
          <line x1={x(h.from)} y1={midY} x2={x(h.to)} y2={midY} className="mathfig-hl" strokeWidth={5} strokeLinecap="round" />
        ) : null}
        {marks.map((t, i) => (
          <g key={i}>
            <line x1={x(t)} y1={midY - 7} x2={x(t)} y2={midY + 7} className="mathfig-axis" strokeWidth={2} />
            <text x={x(t)} y={midY + 28} textAnchor="middle" className="mathfig-tick">
              {t}
            </text>
          </g>
        ))}
        {h ? (
          <g>
            <circle
              cx={x(h.from)}
              cy={midY}
              r={5}
              className={h.openEnds ? "mathfig-open" : "mathfig-dot"}
            />
            {h.to !== h.from ? (
              <circle
                cx={x(h.to)}
                cy={midY}
                r={5}
                className={h.openEnds ? "mathfig-open" : "mathfig-dot"}
              />
            ) : null}
          </g>
        ) : null}
      </svg>
    </figure>
  );
}

function GridFig({ fig }) {
  const m = MATHFIG_MARGIN;
  const iw = MATHFIG_W - m.l - m.r;
  const ih = MATHFIG_H - m.t - m.b;
  const [x0, x1] = fig.xRange;
  const [y0, y1] = fig.yRange;
  const xt = niceTicks(x0, x1, 8) || { ticks: [x0, x1], tmin: x0, tmax: x1 };
  const yt = niceTicks(y0, y1, 6) || { ticks: [y0, y1], tmin: y0, tmax: y1 };
  const x = (v) => linMap(v, xt.tmin, xt.tmax, m.l, m.l + iw);
  const y = (v) => linMap(v, yt.tmin, yt.tmax, m.t + ih, m.t);
  return (
    <Frame title={fig.title}>
      {xt.ticks.map((t) => (
        <line key={`v${t}`} x1={x(t)} y1={m.t} x2={x(t)} y2={m.t + ih} className="mathfig-grid" />
      ))}
      {yt.ticks.map((t) => (
        <line key={`h${t}`} x1={m.l} y1={y(t)} x2={m.l + iw} y2={y(t)} className="mathfig-grid" />
      ))}
      <line x1={m.l} y1={y(0)} x2={m.l + iw} y2={y(0)} className="mathfig-axis" />
      <line x1={x(0)} y1={m.t} x2={x(0)} y2={m.t + ih} className="mathfig-axis" />
      {xt.ticks.map((t) => (
        <text key={`xt${t}`} x={x(t)} y={m.t + ih + 18} textAnchor="middle" className="mathfig-tick">
          {t}
        </text>
      ))}
      {yt.ticks.map((t) => (
        <text key={`yt${t}`} x={m.l - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="mathfig-tick">
          {t}
        </text>
      ))}
      {(fig.lines || []).map((l, i) => (
        <line
          key={`l${i}`}
          x1={x(xt.tmin)}
          y1={y(l.slope * xt.tmin + l.intercept)}
          x2={x(xt.tmax)}
          y2={y(l.slope * xt.tmax + l.intercept)}
          className="mathfig-line"
          strokeWidth={2}
        />
      ))}
      {(fig.points || []).map((p, i) => (
        <g key={`p${i}`}>
          <circle cx={x(p.x)} cy={y(p.y)} r={4} className="mathfig-dot" />
          {p.label ? (
            <text x={x(p.x) + 8} y={y(p.y) - 8} className="mathfig-val">
              {p.label}
            </text>
          ) : null}
        </g>
      ))}
    </Frame>
  );
}

function BoxFig({ fig }) {
  const W = MATHFIG_W;
  const H = 170;
  const l = 46;
  const r = W - 20;
  const midY = 88;
  const lo = Math.min(fig.min, ...(fig.outliers || []));
  const hi = Math.max(fig.max, ...(fig.outliers || []));
  const t = niceTicks(lo, hi, 7) || { ticks: [lo, hi], tmin: lo, tmax: hi };
  const x = (v) => linMap(v, t.tmin, t.tmax, l, r);
  return (
    <figure className="mathfig" role="img" aria-label={fig.title || "Box plot"}>
      {fig.title ? <figcaption className="mathfig-cap">{fig.title}</figcaption> : null}
      <svg className="mathfig-svg" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <line x1={l} y1={midY + 42} x2={r} y2={midY + 42} className="mathfig-axis" />
        {t.ticks.map((v) => (
          <g key={v}>
            <line x1={x(v)} y1={midY + 36} x2={x(v)} y2={midY + 48} className="mathfig-axis" />
            <text x={x(v)} y={midY + 64} textAnchor="middle" className="mathfig-tick">
              {v}
            </text>
          </g>
        ))}
        <line x1={x(fig.min)} y1={midY} x2={x(fig.q1)} y2={midY} className="mathfig-whisk" />
        <line x1={x(fig.q3)} y1={midY} x2={x(fig.max)} y2={midY} className="mathfig-whisk" />
        <line x1={x(fig.min)} y1={midY - 12} x2={x(fig.min)} y2={midY + 12} className="mathfig-whisk" />
        <line x1={x(fig.max)} y1={midY - 12} x2={x(fig.max)} y2={midY + 12} className="mathfig-whisk" />
        <rect
          x={x(fig.q1)}
          y={midY - 22}
          width={Math.max(2, x(fig.q3) - x(fig.q1))}
          height={44}
          className="mathfig-box"
          rx={4}
        />
        <line x1={x(fig.median)} y1={midY - 22} x2={x(fig.median)} y2={midY + 22} className="mathfig-median" />
        {(fig.outliers || []).map((o, i) => (
          <circle key={i} cx={x(o)} cy={midY} r={4.5} className="mathfig-open" />
        ))}
        <text x={x(fig.median)} y={midY - 30} textAnchor="middle" className="mathfig-val">
          {fig.median}
        </text>
      </svg>
    </figure>
  );
}

function TableFig({ fig }) {
  return (
    <figure className="mathfig" role="img" aria-label={fig.title || "Data table"}>
      {fig.title ? <figcaption className="mathfig-cap">{fig.title}</figcaption> : null}
      <table className="mathfig-table">
        <thead>
          <tr>
            {fig.columns.map((c, i) => (
              <th key={i} scope="col">
                <MathText text={String(c)} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fig.rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, j) => (
                <td key={j}>
                  <MathText text={String(cell)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export default function MathFigure({ fig }) {
  const err = validateFigure(fig);
  if (err || !FIGURE_KINDS.includes(fig.kind)) {
    return (
      <div className="mathfig-error" role="img" aria-label="Figure unavailable">
        Figure unavailable.
      </div>
    );
  }
  switch (fig.kind) {
    case "table":
      return <TableFig fig={fig} />;
    case "bar":
      return <BarFig fig={fig} />;
    case "histogram":
      return <HistogramFig fig={fig} />;
    case "line":
      return <LineFig fig={fig} />;
    case "scatter":
      return <ScatterFig fig={fig} />;
    case "pie":
      return <PieFig fig={fig} />;
    case "numberline":
      return <NumberlineFig fig={fig} />;
    case "grid":
      return <GridFig fig={fig} />;
    case "box":
      return <BoxFig fig={fig} />;
    default:
      return (
        <div className="mathfig-error" role="img" aria-label="Figure unavailable">
          Figure unavailable.
        </div>
      );
  }
}
