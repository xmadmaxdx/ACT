export const FIGURE_KINDS = [
  "table",
  "bar",
  "histogram",
  "line",
  "scatter",
  "pie",
  "numberline",
  "grid",
  "box",
];

export const MATHFIG_W = 420;
export const MATHFIG_H = 300;
export const MATHFIG_MARGIN = { l: 46, r: 14, t: 14, b: 36 };

const isFin = (v) => typeof v === "number" && Number.isFinite(v);

function niceStep(raw) {
  if (!(raw > 0)) return 1;
  const power = Math.floor(Math.log10(raw));
  const err = raw / Math.pow(10, power);
  const e10 = Math.sqrt(50);
  const e5 = Math.sqrt(10);
  const e2 = Math.sqrt(2);
  const factor = err >= e10 ? 10 : err >= e5 ? 5 : err >= e2 ? 2 : 1;
  return factor * Math.pow(10, power);
}

export function niceTicks(min, max, maxTicks = 6) {
  if (!isFin(min) || !isFin(max)) return null;
  let lo = min;
  let hi = max;
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  if (lo > hi) {
    const t = lo;
    lo = hi;
    hi = t;
  }
  const step = niceStep((hi - lo) / Math.max(1, maxTicks));
  const tmin = Math.floor(lo / step) * step;
  const tmax = Math.ceil(hi / step) * step;
  const ticks = [];
  const n = Math.round((tmax - tmin) / step);
  for (let i = 0; i <= n && i <= 40; i++) {
    ticks.push(Math.round((tmin + i * step) * 1e10) / 1e10);
  }
  return { ticks, tmin, tmax, step };
}

export function linMap(v, dmin, dmax, p0, p1) {
  if (!isFin(v) || !isFin(dmin) || !isFin(dmax) || dmax === dmin) return p0;
  return p0 + ((v - dmin) / (dmax - dmin)) * (p1 - p0);
}

export function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

const nonEmptyString = (v) => typeof v === "string" && v.length > 0;

function checkTitle(fig) {
  if (fig.title !== undefined && typeof fig.title !== "string") return "title must be a string.";
  return null;
}

const checkers = {
  table(fig) {
    if (!Array.isArray(fig.columns) || fig.columns.length === 0) return "columns must be a non-empty array.";
    if (!fig.columns.every((c) => typeof c === "string")) return "columns must be strings.";
    if (!Array.isArray(fig.rows) || fig.rows.length === 0) return "rows must be a non-empty array.";
    for (let i = 0; i < fig.rows.length; i++) {
      const row = fig.rows[i];
      if (!Array.isArray(row) || row.length !== fig.columns.length) {
        return `rows[${i}] must have ${fig.columns.length} cells.`;
      }
      if (!row.every((c) => typeof c === "string" || typeof c === "number")) {
        return `rows[${i}] cells must be strings or numbers.`;
      }
    }
    return null;
  },
  bar(fig) {
    if (!Array.isArray(fig.categories) || fig.categories.length === 0) return "categories must be a non-empty array.";
    if (!fig.categories.every((c) => typeof c === "string")) return "categories must be strings.";
    if (!Array.isArray(fig.values) || fig.values.length !== fig.categories.length) {
      return "values must match categories in length.";
    }
    if (!fig.values.every(isFin)) return "values must be finite numbers.";
    if (fig.yMax !== undefined && (!isFin(fig.yMax) || fig.yMax <= 0)) return "yMax must be a positive number.";
    if (fig.yLabel !== undefined && typeof fig.yLabel !== "string") return "yLabel must be a string.";
    return null;
  },
  histogram(fig) {
    if (!Array.isArray(fig.bins) || fig.bins.length === 0) return "bins must be a non-empty array.";
    for (let i = 0; i < fig.bins.length; i++) {
      const b = fig.bins[i];
      if (!b || typeof b !== "object") return `bins[${i}] must be an object.`;
      if (!isFin(b.lo) || !isFin(b.hi) || !isFin(b.count)) return `bins[${i}] needs lo, hi, count numbers.`;
      if (!(b.hi > b.lo)) return `bins[${i}] needs hi above lo.`;
      if (b.count < 0) return `bins[${i}] count must be 0 or more.`;
    }
    const sorted = fig.bins.slice().sort((a, b) => a.lo - b.lo);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].lo < sorted[i - 1].hi) return "bins must not overlap; sort by lo.";
    }
    if (fig.yLabel !== undefined && typeof fig.yLabel !== "string") return "yLabel must be a string.";
    return null;
  },
  line(fig) {
    if (!Array.isArray(fig.points) || fig.points.length === 0) return "points must be a non-empty array.";
    for (let i = 0; i < fig.points.length; i++) {
      const p = fig.points[i];
      if (!p || typeof p !== "object") return `points[${i}] must be an object.`;
      if (typeof p.x !== "string" || !isFin(p.y)) return `points[${i}] needs x label and y number.`;
    }
    if (fig.yLabel !== undefined && typeof fig.yLabel !== "string") return "yLabel must be a string.";
    return null;
  },
  scatter(fig) {
    if (!Array.isArray(fig.points) || fig.points.length === 0) return "points must be a non-empty array.";
    for (let i = 0; i < fig.points.length; i++) {
      const p = fig.points[i];
      if (!p || typeof p !== "object" || !isFin(p.x) || !isFin(p.y)) {
        return `points[${i}] needs x and y numbers.`;
      }
    }
    if (fig.trend !== undefined) {
      if (!fig.trend || typeof fig.trend !== "object") return "trend must be an object.";
      if (!isFin(fig.trend.slope) || !isFin(fig.trend.intercept)) {
        return "trend needs slope and intercept numbers.";
      }
    }
    if (fig.xLabel !== undefined && typeof fig.xLabel !== "string") return "xLabel must be a string.";
    if (fig.yLabel !== undefined && typeof fig.yLabel !== "string") return "yLabel must be a string.";
    return null;
  },
  pie(fig) {
    if (!Array.isArray(fig.slices) || fig.slices.length === 0) return "slices must be a non-empty array.";
    let sum = 0;
    for (let i = 0; i < fig.slices.length; i++) {
      const s = fig.slices[i];
      if (!s || typeof s !== "object") return `slices[${i}] must be an object.`;
      if (typeof s.label !== "string") return `slices[${i}] needs a label.`;
      if (!isFin(s.value) || s.value < 0) return `slices[${i}] value must be 0 or more.`;
      sum += s.value;
    }
    if (!(sum > 0)) return "slices must sum above 0.";
    return null;
  },
  numberline(fig) {
    if (!isFin(fig.min) || !isFin(fig.max) || !(fig.max > fig.min)) {
      return "min and max must be numbers with max above min.";
    }
    if (fig.marks !== undefined) {
      if (!Array.isArray(fig.marks) || !fig.marks.every(isFin)) return "marks must be numbers.";
    }
    if (fig.highlight !== undefined) {
      const h = fig.highlight;
      if (!h || typeof h !== "object" || !isFin(h.from) || !isFin(h.to)) {
        return "highlight needs from and to numbers.";
      }
      if (h.to < h.from) return "highlight to must be at or above from.";
      if (h.openEnds !== undefined && typeof h.openEnds !== "boolean") {
        return "highlight openEnds must be true or false.";
      }
    }
    return null;
  },
  grid(fig) {
    const xr = fig.xRange;
    const yr = fig.yRange;
    if (!Array.isArray(xr) || xr.length !== 2 || !isFin(xr[0]) || !isFin(xr[1]) || !(xr[1] > xr[0])) {
      return "xRange must be [min, max] with max above min.";
    }
    if (!Array.isArray(yr) || yr.length !== 2 || !isFin(yr[0]) || !isFin(yr[1]) || !(yr[1] > yr[0])) {
      return "yRange must be [min, max] with max above min.";
    }
    if (fig.points !== undefined) {
      if (!Array.isArray(fig.points)) return "points must be an array.";
      for (let i = 0; i < fig.points.length; i++) {
        const p = fig.points[i];
        if (!p || typeof p !== "object" || !isFin(p.x) || !isFin(p.y)) {
          return `points[${i}] needs x and y numbers.`;
        }
        if (p.label !== undefined && typeof p.label !== "string") return `points[${i}] label must be a string.`;
      }
    }
    if (fig.lines !== undefined) {
      if (!Array.isArray(fig.lines)) return "lines must be an array.";
      for (let i = 0; i < fig.lines.length; i++) {
        const l = fig.lines[i];
        if (!l || typeof l !== "object" || !isFin(l.slope) || !isFin(l.intercept)) {
          return `lines[${i}] needs slope and intercept numbers.`;
        }
      }
    }
    return null;
  },
  box(fig) {
    const keys = ["min", "q1", "median", "q3", "max"];
    for (const k of keys) {
      if (!isFin(fig[k])) return `${k} must be a finite number.`;
    }
    if (!(fig.min <= fig.q1 && fig.q1 <= fig.median && fig.median <= fig.q3 && fig.q3 <= fig.max)) {
      return "need min <= q1 <= median <= q3 <= max.";
    }
    if (fig.outliers !== undefined && (!Array.isArray(fig.outliers) || !fig.outliers.every(isFin))) {
      return "outliers must be numbers.";
    }
    return null;
  },
};

export function validateFigure(fig) {
  if (!fig || typeof fig !== "object" || Array.isArray(fig)) return "figure must be an object.";
  if (!nonEmptyString(fig.id)) return "figure id must be a non-empty string.";
  if (!FIGURE_KINDS.includes(fig.kind)) return `figure kind must be one of ${FIGURE_KINDS.join(", ")}.`;
  const titleErr = checkTitle(fig);
  if (titleErr) return titleErr;
  return checkers[fig.kind](fig);
}
