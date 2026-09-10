import { useCallback, useEffect, useRef, useState } from "react";
import { getStroke } from "perfect-freehand";

const INK = "#1f2937";
const COLORS = ["#1f2937", "#1cb0f6", "#16a34a", "#ea580c"];
const MIN_SIZE = 20;
const HANDLE_R = 12;

const average = (a, b) => (a + b) / 2;

function getSvgPathFromStroke(points) {
  const len = points.length;
  if (len < 4) return "";
  let a = points[0];
  let b = points[1];
  const c = points[2];
  let result =
    `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(2)},${b[1].toFixed(2)} ` +
    `${average(b[0], c[0]).toFixed(2)},${average(b[1], c[1]).toFixed(2)} T`;
  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i];
    b = points[i + 1];
    result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(2)} `;
  }
  return result + "Z";
}

const STROKE_OPTIONS = {
  size: 14,
  thinning: 0.55,
  smoothing: 0.5,
  streamline: 0.5,
  simulatePressure: true,
};

let uid = 0;
const nid = (p) => `${p}-${Date.now().toString(36)}-${uid++}`;

const rad = (d) => (d * Math.PI) / 180;
const rot = (px, py, deg) => {
  const a = rad(deg);
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [px * c - py * s, px * s + py * c];
};

function toParent(obj, lx, ly) {
  const cx = obj.x + obj.w / 2;
  const cy = obj.y + obj.h / 2;
  const [rx, ry] = rot(lx - obj.w / 2, ly - obj.h / 2, obj.rotation);
  return [cx + rx, cy + ry];
}

function toLocal(obj, px, py) {
  const cx = obj.x + obj.w / 2;
  const cy = obj.y + obj.h / 2;
  const [rx, ry] = rot(px - cx, py - cy, -obj.rotation);
  return [rx + obj.w / 2, ry + obj.h / 2];
}

function rotatedBox(obj) {
  const corners = [
    toParent(obj, 0, 0),
    toParent(obj, obj.w, 0),
    toParent(obj, obj.w, obj.h),
    toParent(obj, 0, obj.h),
  ];
  const xs = corners.map((p) => p[0]);
  const ys = corners.map((p) => p[1]);
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

function textMetrics(t) {
  const lines = String(t.text || "").split("\n");
  const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);
  return { w: Math.max(40, longest * t.fontSize * 0.55 + 16), h: lines.length * t.fontSize * 1.25 + 12 };
}

function shapeBody(shape, w, h, stroke) {
  const sw = 2.5;
  const common = { fill: "#ffffff", stroke, strokeWidth: sw, strokeLinejoin: "round", strokeLinecap: "round" };
  const dash = { ...common, strokeDasharray: "7 5" };
  switch (shape) {
    case "rtriangle":
      return <polygon points={`0,0 0,${h} ${w},${h}`} {...common} />;
    case "triangle":
      return <polygon points={`0,${h} ${w},${h} ${w / 2},0`} {...common} />;
    case "trapezoid":
      return <polygon points={`${w / 4},0 ${(3 * w) / 4},0 ${w},${h} 0,${h}`} {...common} />;
    case "square":
      return <rect x={0} y={0} width={w} height={h} {...common} />;
    case "circle":
      return <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} {...common} />;
    case "cone": {
      const ey = (5 * h) / 6;
      const ry = h / 6;
      return (
        <g {...common} fill="none">
          <line x1={w / 2} y1={0} x2={0} y2={ey} />
          <line x1={w / 2} y1={0} x2={w} y2={ey} />
          <path d={`M 0,${ey} A ${w / 2},${ry} 0 0 0 ${w},${ey}`} />
          <path d={`M ${w},${ey} A ${w / 2},${ry} 0 0 0 0,${ey}`} {...dash} fill="none" />
        </g>
      );
    }
    case "pyramid": {
      const ax = w / 2;
      const ay = 0;
      const flx = w / 6;
      const frx = (5 * w) / 6;
      const brx = w;
      const blx = w / 3;
      const fy = h;
      const by = (2 * h) / 3;
      return (
        <g {...common} fill="none">
          <polygon points={`${flx},${fy} ${frx},${fy} ${brx},${by} ${blx},${by}`} />
          <line x1={flx} y1={fy} x2={ax} y2={ay} />
          <line x1={frx} y1={fy} x2={ax} y2={ay} />
          <line x1={brx} y1={by} x2={ax} y2={ay} />
          <line x1={blx} y1={by} x2={flx} y2={fy} {...dash} />
          <line x1={blx} y1={by} x2={ax} y2={ay} {...dash} />
        </g>
      );
    }
    case "prism": {
      const a = [0, h / 3];
      const b = [(2 * w) / 3, h / 3];
      const c = [(2 * w) / 3, h];
      const d = [0, h];
      const ap = [w / 3, 0];
      const bp = [w, 0];
      const cp = [w, (2 * h) / 3];
      const dp = [w / 3, (2 * h) / 3];
      const seg = (p, q, extra) => (
        <line x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} {...common} fill="none" {...extra} />
      );
      return (
        <g>
          {seg(a, b)}
          {seg(b, c)}
          {seg(c, d)}
          {seg(d, a)}
          {seg(ap, bp)}
          {seg(bp, cp)}
          {seg(a, ap)}
          {seg(b, bp)}
          {seg(c, cp)}
          {seg(d, dp, dash)}
          {seg(dp, ap, dash)}
          {seg(dp, cp, dash)}
        </g>
      );
    }
    default:
      return null;
  }
}

const SHAPES = [
  { id: "rtriangle", label: "Right triangle" },
  { id: "triangle", label: "Triangle" },
  { id: "trapezoid", label: "Trapezoid" },
  { id: "square", label: "Square" },
  { id: "circle", label: "Circle" },
  { id: "cone", label: "Cone" },
  { id: "pyramid", label: "Pyramid" },
  { id: "prism", label: "Prism" },
];

function ShapeIcon({ id }) {
  return (
    <svg width="26" height="22" viewBox="0 0 34 28" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
        {id === "rtriangle" && <polygon points="6,2 6,24 28,24" />}
        {id === "triangle" && <polygon points="4,24 30,24 17,3" />}
        {id === "trapezoid" && <polygon points="11,3 23,3 29,24 5,24" />}
        {id === "square" && <rect x="6" y="4" width="20" height="20" />}
        {id === "circle" && <circle cx="17" cy="14" r="11" />}
        {id === "cone" && (
          <g>
            <path d="M17 2 L7 20 M17 2 L27 20" />
            <ellipse cx="17" cy="20" rx="10" ry="3.2" />
          </g>
        )}
        {id === "pyramid" && (
          <g>
            <polygon points="6,24 28,24 24,14 10,14" />
            <path d="M6,24 L17,3 M28,24 L17,3 M24,14 L17,3" />
          </g>
        )}
        {id === "prism" && (
          <g>
            <rect x="4" y="9" width="19" height="15" />
            <path d="M11 9 L15 3 L30 3 L30 18 L23 24 M15 3 L4 9 M30 3 L23 9 M30 18 L23 24" strokeDasharray="0" />
            <path d="M4 24 L11 18 M11 18 L15 12 M11 18 L26 18" strokeDasharray="3 2.5" />
          </g>
        )}
      </g>
    </svg>
  );
}

const clone = (o) => JSON.parse(JSON.stringify(o));

export default function FreestyleBoard() {
  const [objects, setObjects] = useState([]);
  const [tool, setTool] = useState("select");
  const [color, setColor] = useState(INK);
  const [selectedIds, setSelectedIds] = useState([]);
  const [cam, setCam] = useState({ x: 0, y: 0, zoom: 1 });
  const [marquee, setMarquee] = useState(null);
  const [penSize, setPenSize] = useState(14);
  const [activePath, setActivePath] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");
  const [history, setHistory] = useState([]);

  const svgRef = useRef(null);
  const pointsRef = useRef([]);
  const rafRef = useRef(0);
  const drawingRef = useRef(false);
  const gestureRef = useRef(null);
  const spaceRef = useRef(false);

  const objectsRef = useRef(objects);
  objectsRef.current = objects;
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;
  const camRef = useRef(cam);
  camRef.current = cam;
  const sizeRef = useRef(penSize);
  sizeRef.current = penSize;

  const pushHistory = useCallback(() => {
    setHistory((h) => [...h.slice(-59), clone(objectsRef.current)]);
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      setObjects(clone(h[h.length - 1]));
      setSelectedIds([]);
      setEditingId(null);
      return h.slice(0, -1);
    });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || "";
      if (editingId || /^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIdsRef.current.length > 0) {
        e.preventDefault();
        pushHistory();
        setObjects((o) => o.filter((x) => !selectedIdsRef.current.includes(x.id)));
        setSelectedIds([]);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editingId, undo, pushHistory]);

  useEffect(() => {
    const dn = (e) => {
      if (e.code === "Space" && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || "")) {
        spaceRef.current = true;
        e.preventDefault();
      }
    };
    const up = (e) => {
      if (e.code === "Space") spaceRef.current = false;
    };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", dn);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e) => {
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      const dy = e.deltaY * unit;
      const rect = svg.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      setCam((c) => {
        const zoom = Math.min(3, Math.max(0.2, c.zoom * Math.exp(-dy * 0.0022)));
        return { zoom, x: c.x + sx / c.zoom - sx / zoom, y: c.y + sy / c.zoom - sy / zoom };
      });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const boardPoint = useCallback((clientX, clientY) => {
    const rect = svgRef.current.getBoundingClientRect();
    const c = camRef.current;
    return [(clientX - rect.left) / c.zoom + c.x, (clientY - rect.top) / c.zoom + c.y];
  }, []);

  const renderActive = useCallback(() => {
    if (pointsRef.current.length > 0) {
      const outline = getStroke(pointsRef.current, { ...STROKE_OPTIONS, size: sizeRef.current });
      setActivePath(getSvgPathFromStroke(outline));
    }
    rafRef.current = 0;
  }, []);

  const scheduleRender = useCallback(() => {
    if (rafRef.current !== 0) return;
    rafRef.current = requestAnimationFrame(() => {
      renderActive();
      rafRef.current = 0;
    });
  }, [renderActive]);

  const selectInMarquee = useCallback((r) => {
    const x0 = Math.min(r.x0, r.x1);
    const x1 = Math.max(r.x0, r.x1);
    const y0 = Math.min(r.y0, r.y1);
    const y1 = Math.max(r.y0, r.y1);
    const hits = [];
    for (const o of objectsRef.current) {
      let b = null;
      if (o.type === "pen") {
        if (typeof o.x !== "number") continue;
        b = { minX: o.x, minY: o.y, maxX: o.x + o.w, maxY: o.y + o.h };
      } else {
        b = rotatedBox(o);
      }
      if (b.minX <= x1 && b.maxX >= x0 && b.minY <= y1 && b.maxY >= y0) hits.push(o.id);
    }
    setSelectedIds(hits);
    setEditingId(null);
  }, []);

  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const selected = objects.find((o) => o.id === selectedId) || null;

  const onPointerDown = useCallback(
    (e) => {
      const svg = svgRef.current;
      if (!svg) return;
      try {
        if (e.isPrimary !== false) svg.setPointerCapture(e.pointerId);
      } catch {
        /* Emulated or duplicate pointer: events still bubble to the svg. */
      }
      const [px, py] = boardPoint(e.clientX, e.clientY);

      if (tool === "move") {
        gestureRef.current = { kind: "pan", lx: e.clientX, ly: e.clientY };
        return;
      }

      if (tool === "pen") {
        drawingRef.current = true;
        pointsRef.current = [[px, py, e.nativeEvent.pressure || 0.5]];
        scheduleRender();
        return;
      }

      if (tool === "text") {
        pushHistory();
        const id = nid("txt");
        setObjects((o) => [
          ...o,
          { id, type: "text", x: px, y: py, w: 120, h: 32, rotation: 0, text: "", fontSize: 19, color },
        ]);
        setSelectedIds([id]);
        setEditingId(id);
        setDraft("");
        setTool("select");
        return;
      }

      const handleEl = e.target && e.target.closest ? e.target.closest("[data-handle]") : null;
      if (handleEl && selectedId) {
        const obj = objectsRef.current.find((o) => o.id === selectedId);
        if (!obj || obj.type === "pen") return;
        const kind = handleEl.getAttribute("data-handle");
        if (kind === "rotate") {
          const [cx, cy] = toParent(obj, obj.w / 2, obj.h / 2);
          const grab = Math.atan2(py - cy, px - cx);
          gestureRef.current = { kind: "rotate", id: obj.id, cx, cy, grab, startR: obj.rotation };
        } else {
          gestureRef.current = { kind: "resize", id: obj.id, corner: kind, S: { ...obj } };
          pushHistory();
        }
        return;
      }

      const g = e.target && e.target.closest ? e.target.closest("[data-id]") : null;
      if (g) {
        const id = g.getAttribute("data-id");
        const obj = objectsRef.current.find((o) => o.id === id);
        const ids = selectedIdsRef.current.includes(id) ? [...selectedIdsRef.current] : [id];
        setSelectedIds(ids);
        setEditingId(null);
        if (obj && obj.type !== "pen") {
          gestureRef.current = { kind: "maybe-move", ids, startX: px, startY: py, moved: false };
        } else if (obj && ids.length > 1) {
          gestureRef.current = { kind: "maybe-move", ids, startX: px, startY: py, moved: false };
        }
        return;
      }

      if (e.button === 1 || spaceRef.current) {
        if (e.button === 1) e.preventDefault();
        gestureRef.current = { kind: "pan", lx: e.clientX, ly: e.clientY };
        return;
      }
      gestureRef.current = { kind: "marquee", x0: px, y0: py, x1: px, y1: py };
      setMarquee({ x0: px, y0: py, x1: px, y1: py });
      setSelectedIds([]);
      setEditingId(null);
    },
    [tool, color, boardPoint, scheduleRender, pushHistory]
  );

  const onPointerMove = useCallback(
    (e) => {
      const [px, py] = boardPoint(e.clientX, e.clientY);

      if (drawingRef.current) {
        pointsRef.current.push([px, py, e.nativeEvent.pressure || 0.5]);
        scheduleRender();
        return;
      }

      const g = gestureRef.current;
      if (!g) return;
      if (g.kind === "marquee") {
        const r = { ...g, x1: px, y1: py };
        gestureRef.current = r;
        setMarquee(r);
        selectInMarquee(r);
        return;
      }
      if (g.kind === "pan") {
        setCam((c) => ({
          ...c,
          x: c.x - (e.clientX - g.lx) / c.zoom,
          y: c.y - (e.clientY - g.ly) / c.zoom,
        }));
        g.lx = e.clientX;
        g.ly = e.clientY;
        return;
      }
      const obj = objectsRef.current.find((o) => o.id === (g.ids ? g.ids[0] : g.id));
      if (!obj) {
        gestureRef.current = null;
        return;
      }

      if (g.kind === "maybe-move") {
        if (Math.abs(px - g.startX) + Math.abs(py - g.startY) > 3 && !g.moved) {
          g.moved = true;
          pushHistory();
        }
        if (!g.moved) return;
        const dx = px - g.startX;
        const dy = py - g.startY;
        g.startX = px;
        g.startY = py;
        setObjects((objs) =>
          objs.map((o) =>
            g.ids.includes(o.id) && typeof o.x === "number" ? { ...o, x: o.x + dx, y: o.y + dy } : o
          )
        );
        return;
      }

      if (g.kind === "rotate") {
        const ang = Math.atan2(py - g.cy, px - g.cx);
        let deg = g.startR + ((ang - g.grab) * 180) / Math.PI;
        deg = ((deg % 360) + 360) % 360;
        setObjects((objs) => (objs.map((o) => (o.id === g.id ? { ...o, rotation: Math.round(deg) } : o))));
        return;
      }

      if (g.kind === "resize") {
        const S = g.S;
        const [lx, ly] = toLocal(S, px, py);
        let nw = S.w;
        let nh = S.h;
        let fnx = 0;
        let fny = 0;
        if (g.corner === "br") {
          nw = lx;
          nh = ly;
          fnx = 0;
          fny = 0;
        } else if (g.corner === "tl") {
          nw = S.w - lx;
          nh = S.h - ly;
          fnx = nw;
          fny = nh;
        } else if (g.corner === "tr") {
          nw = lx;
          nh = S.h - ly;
          fnx = 0;
          fny = nh;
        } else {
          nw = S.w - lx;
          nh = ly;
          fnx = nw;
          fny = 0;
        }
        nw = Math.max(MIN_SIZE, nw);
        nh = Math.max(MIN_SIZE, nh);
        const [ffx, ffy] =
          g.corner === "br"
            ? [0, 0]
            : g.corner === "tl"
              ? [S.w, S.h]
              : g.corner === "tr"
                ? [0, S.h]
                : [S.w, 0];
        const [Fpx, Fpy] = toParent(S, ffx, ffy);
        const c = Math.cos(rad(S.rotation));
        const s = Math.sin(rad(S.rotation));
        const ox = Fpx - (nw / 2 + ((fnx - nw / 2) * c - (fny - nh / 2) * s));
        const oy = Fpy - (nh / 2 + ((fnx - nw / 2) * s + (fny - nh / 2) * c));
        setObjects((objs) =>
          objs.map((o) => (o.id === g.id ? { ...o, x: ox, y: oy, w: nw, h: nh } : o))
        );
      }
    },
    [boardPoint, scheduleRender, pushHistory, selectInMarquee]
  );

  const finishStroke = useCallback(() => {
    drawingRef.current = false;
    if (pointsRef.current.length > 0) {
      const finalOutline = getStroke(pointsRef.current, { ...STROKE_OPTIONS, size: sizeRef.current, last: true });
      const finalPath = getSvgPathFromStroke(finalOutline);
      if (finalPath) {
        pushHistory();
        const strokeColor = colorRef.current;
        const pts = pointsRef.current;
        const xs = pts.map((p) => p[0]);
        const ys = pts.map((p) => p[1]);
        const pad = sizeRef.current;
        const bx = Math.min(...xs) - pad;
        const by = Math.min(...ys) - pad;
        setObjects((o) => [
          ...o,
          {
            id: nid("pen"),
            type: "pen",
            path: finalPath,
            color: strokeColor,
            x: bx,
            y: by,
            w: Math.max(...xs) - bx + pad,
            h: Math.max(...ys) - by + pad,
          },
        ]);
      }
      pointsRef.current = [];
      setActivePath("");
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, [pushHistory]);

  const colorRef = useRef(color);
  colorRef.current = color;

  const onPointerUp = useCallback(() => {
    if (drawingRef.current) {
      finishStroke();
      return;
    }
    gestureRef.current = null;
    setMarquee(null);
  }, [finishStroke]);

  const onPointerLeave = useCallback((e) => {
    if (e && e.buttons !== 0) return;
    if (drawingRef.current) finishStroke();
    gestureRef.current = null;
    setMarquee(null);
  }, [finishStroke]);

  const addShape = useCallback(
    (shape) => {
      pushHistory();
      const squareLike = shape === "square" || shape === "circle";
      const w = squareLike ? 110 : 150;
      const h = squareLike ? 110 : 105;
      const rect = svgRef.current.getBoundingClientRect();
      const id = nid("shp");
      setObjects((o) => [
        ...o,
        {
          id,
          type: "shape",
          shape,
          x: Math.max(8, rect.width / 2 - w / 2),
          y: Math.max(8, rect.height / 2 - h / 2),
          w,
          h,
          rotation: 0,
          color: colorRef.current,
        },
      ]);
      setSelectedIds([id]);
      setTool("select");
    },
    [pushHistory]
  );

  const commitText = useCallback(
    (id, value) => {
      const text = value.trim();
      if (!text) {
        pushHistory();
        setObjects((o) => o.filter((x) => x.id !== id));
      } else {
        pushHistory();
        setObjects((o) =>
          o.map((x) => {
            if (x.id !== id) return x;
            const m = textMetrics({ text, fontSize: x.fontSize });
            return { ...x, text, w: m.w, h: m.h };
          })
        );
      }
      setEditingId(null);
    },
    [pushHistory]
  );

  const deleteSelected = useCallback(() => {
    if (selectedIdsRef.current.length === 0) return;
    pushHistory();
    setObjects((o) => o.filter((x) => !selectedIdsRef.current.includes(x.id)));
    setSelectedIds([]);
    setEditingId(null);
  }, [pushHistory]);

  const clearAll = useCallback(() => {
    if (objectsRef.current.length === 0) return;
    pushHistory();
    setObjects([]);
    setSelectedIds([]);
    setEditingId(null);
  }, [pushHistory]);

  const startEdit = useCallback((id) => {
    const obj = objectsRef.current.find((o) => o.id === id);
    if (!obj || obj.type !== "text") return;
    setSelectedIds([id]);
    setEditingId(id);
    setDraft(obj.text);
  }, []);

  const focusSelectRef = useCallback((el) => {
    if (el) {
      el.focus({ preventScroll: true });
      el.select();
    }
  }, []);

  const selBox = selected && selected.type !== "pen" ? rotatedBox(selected) : null;

  return (
    <div className="board-wrap">
      <div className="board-toolbar" role="toolbar" aria-label="Whiteboard tools">
        <div className="board-tool-group">
          <button
            type="button"
            className={tool === "select" ? "board-tool active" : "board-tool"}
            onClick={() => setTool("select")}
            title="Select: tap objects to grab, drag empty space to multi-select, drag objects to move"
          >
            Select
          </button>
          <button
            type="button"
            className={tool === "pen" ? "board-tool active" : "board-tool"}
            onClick={() => setTool("pen")}
            title="Pen: draw freehand (width via Size slider)"
          >
            Pen
          </button>
          <button
            type="button"
            className={tool === "text" ? "board-tool active" : "board-tool"}
            onClick={() => setTool("text")}
            title="Text: click anywhere to write"
          >
            Text
          </button>
          <button
            type="button"
            className={tool === "move" ? "board-tool active" : "board-tool"}
            onClick={() => setTool("move")}
            title="Move: drag anywhere to pan the view"
          >
            Move
          </button>
        </div>
        <div className="board-tool-group board-shapes">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              type="button"
              className="board-tool board-shape"
              title={s.label}
              aria-label={`Add ${s.label}`}
              onClick={() => addShape(s.id)}
            >
              <ShapeIcon id={s.id} />
            </button>
          ))}
        </div>
        <div className="board-tool-group">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={color === c ? "board-dot active" : "board-dot"}
              style={{ background: c }}
              aria-label={`Ink ${c}`}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <div className="board-tool-group" title="Pen size">
          <span className="board-size-label">Size</span>
          <input
            type="range"
            className="board-size"
            min={4}
            max={32}
            step={1}
            value={penSize}
            onChange={(e) => setPenSize(Number(e.target.value))}
            aria-label="Pen size"
          />
          <span className="board-size-val">{penSize}</span>
        </div>
        <div className="board-tool-group">
          <button type="button" className="board-tool" onClick={undo} title="Undo">
            Undo
          </button>
          <button
            type="button"
            className="board-tool"
            onClick={deleteSelected}
            disabled={selectedIds.length === 0}
            title={selectedIds.length > 1 ? `Delete ${selectedIds.length} selected (Del)` : "Delete selected (Del)"}
          >
            Del{selectedIds.length > 1 ? ` (${selectedIds.length})` : ""}
          </button>
          <button type="button" className="board-tool" onClick={clearAll} title="Clear board">
            Clear
          </button>
        </div>
      </div>

      <div className="board-canvas-wrap">
        <svg
          ref={svgRef}
          className="board-svg"
          role="application"
          aria-label="Scratch whiteboard"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerLeave}
          onDoubleClick={(e) => {
            const g = e.target && e.target.closest ? e.target.closest("[data-id]") : null;
            if (g && tool === "select") startEdit(g.getAttribute("data-id"));
          }}
          style={{ touchAction: "none", cursor: tool === "move" ? "grab" : tool === "pen" ? "crosshair" : "default" }}
        >
          <defs>
            <pattern
              id="board-dots"
              width={22 * cam.zoom}
              height={22 * cam.zoom}
              patternUnits="userSpaceOnUse"
              x={((-cam.x * cam.zoom) % (22 * cam.zoom) + 22 * cam.zoom) % (22 * cam.zoom)}
              y={((-cam.y * cam.zoom) % (22 * cam.zoom) + 22 * cam.zoom) % (22 * cam.zoom)}
            >
              <circle cx={(22 * cam.zoom) / 2} cy={(22 * cam.zoom) / 2} r={Math.min(3.5, Math.max(0.7, 1.5 * cam.zoom))} fill="#dbe4ee" />
            </pattern>
          </defs>
          <rect x={0} y={0} width="100%" height="100%" fill="url(#board-dots)" />
          <text x={12} y={22} fontSize={12} fill="#94a3b8" pointerEvents="none">
            {Math.round(cam.zoom * 100)}%{selectedIds.length > 1 ? ` · ${selectedIds.length} selected` : ""}
          </text>

          <g transform={`translate(${-cam.x * cam.zoom},${-cam.y * cam.zoom}) scale(${cam.zoom})`}>
          {objects.map((o) => {
            if (o.type === "pen") {
              return (
                <g key={o.id} data-id={o.id}>
                  <path d={o.path} fill={o.color} pointerEvents="all" />
                </g>
              );
            }
            if (o.type === "text") {
              if (editingId === o.id) return <g key={o.id} data-id={o.id} />;
              const lines = String(o.text || "").split("\n");
              return (
                <g
                  key={o.id}
                  data-id={o.id}
                  transform={`translate(${o.x},${o.y}) rotate(${o.rotation})`}
                >
                  <text fontSize={o.fontSize} fill={o.color} dominantBaseline="hanging" pointerEvents="all">
                    {lines.map((line, i) => (
                      <tspan key={i} x={0} dy={i === 0 ? 0 : o.fontSize * 1.2}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              );
            }
            return (
              <g
                key={o.id}
                data-id={o.id}
                transform={`translate(${o.x},${o.y}) rotate(${o.rotation},${o.w / 2},${o.h / 2})`}
              >
                {shapeBody(o.shape, o.w, o.h, o.color)}
              </g>
            );
          })}

          {activePath && <path d={activePath} fill={color} pointerEvents="none" />}

          {selected && selected.type !== "pen" && selBox && (
            <g pointerEvents="none">
              <rect
                x={selBox.minX}
                y={selBox.minY}
                width={selBox.maxX - selBox.minX}
                height={selBox.maxY - selBox.minY}
                fill="none"
                stroke="#1cb0f6"
                strokeWidth={1.5 / cam.zoom}
                strokeDasharray={`${6 / cam.zoom} ${4 / cam.zoom}`}
              />
            </g>
          )}

          {selectedIds.length > 1 && (
            <g pointerEvents="none">
              {objects
                .filter((o) => selectedIds.includes(o.id) && o.type !== "pen")
                .map((o) => {
                  const b = rotatedBox(o);
                  return (
                    <rect
                      key={o.id}
                      x={b.minX}
                      y={b.minY}
                      width={b.maxX - b.minX}
                      height={b.maxY - b.minY}
                      fill="none"
                      stroke="#1cb0f6"
                      strokeWidth={1 / cam.zoom}
                      strokeDasharray={`${4 / cam.zoom} ${3 / cam.zoom}`}
                    />
                  );
                })}
            </g>
          )}

          {marquee && (() => {
            const mx = Math.min(marquee.x0, marquee.x1);
            const my = Math.min(marquee.y0, marquee.y1);
            return (
              <rect
                x={mx}
                y={my}
                width={Math.abs(marquee.x1 - marquee.x0)}
                height={Math.abs(marquee.y1 - marquee.y0)}
                fill="rgba(28,176,246,0.08)"
                stroke="#1cb0f6"
                strokeWidth={1.5 / cam.zoom}
                strokeDasharray={`${6 / cam.zoom} ${4 / cam.zoom}`}
                pointerEvents="none"
              />
            );
          })()}

          {selected && selected.type !== "pen" && (
            <g
              transform={`translate(${selected.x},${selected.y}) rotate(${selected.rotation},${selected.w / 2},${selected.h / 2})`}
            >
              {[
                ["tl", 0, 0],
                ["tr", selected.w, 0],
                ["bl", 0, selected.h],
                ["br", selected.w, selected.h],
              ].map(([id, cx, cy]) => (
                <circle
                  key={id}
                  data-handle={id}
                  cx={cx}
                  cy={cy}
                  r={HANDLE_R / cam.zoom}
                  fill="#fff"
                  stroke="#1cb0f6"
                  strokeWidth={2 / cam.zoom}
                  style={{ cursor: "nwse-resize", pointerEvents: "all" }}
                />
              ))}
              <line
                x1={selected.w / 2}
                y1={0}
                x2={selected.w / 2}
                y2={-26}
                stroke="#1cb0f6"
                strokeWidth={1.5 / cam.zoom}
              />
              <circle
                data-handle="rotate"
                cx={selected.w / 2}
                cy={-32}
                r={HANDLE_R / cam.zoom}
                fill="#1cb0f6"
                style={{ cursor: "grab", pointerEvents: "all" }}
              />
            </g>
          )}
          </g>
        </svg>

        {editingId && (() => {
          const obj = objects.find((o) => o.id === editingId);
          if (!obj || obj.type !== "text") return null;
          return (
            <textarea
              className="board-text-editor"
              style={{
                left: (obj.x - cam.x) * cam.zoom,
                top: (obj.y - cam.y) * cam.zoom,
                fontSize: obj.fontSize * cam.zoom,
                color: obj.color,
                width: Math.max(140, obj.w * cam.zoom),
              }}
              value={draft}
              rows={3}
              ref={focusSelectRef}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => commitText(editingId, draft)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  setEditingId(null);
                } else if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  commitText(editingId, draft);
                }
              }}
            />
          );
        })()}
      </div>
    </div>
  );
}
