import { useCallback, useEffect, useRef, useState } from "react";
import SupportersWall from "./supporter_wall/SupportersWall.jsx";
import swJsx from "./supporter_wall/SupportersWall.jsx?raw";
import swCss from "./supporter_wall/supporters-wall.css?raw";
import Leaderboard from "./leaderboard/Leaderboard.jsx";
import lbJsx from "./leaderboard/Leaderboard.jsx?raw";
import lbCss from "./leaderboard/leaderboard.css?raw";
import Recap from "./recap/Recap.jsx";
import rcJsx from "./recap/Recap.jsx?raw";
import rcCss from "./recap/recap.css?raw";
import Summary from "./summary/Summary.jsx";
import sumJsx from "./summary/Summary.jsx?raw";
import sumCss from "./summary/summary.css?raw";
import Ai from "./ai/Ai.jsx";
import aiJsx from "./ai/Ai.jsx?raw";
import aiCss from "./ai/ai.css?raw";
import Community from "./community/Community.jsx";
import cmAppJsx from "./community/Community.jsx?raw";
import cmFeedJsx from "./community/FeedPages.jsx?raw";
import cmChatJsx from "./community/ChatPages.jsx?raw";
import cmUiJsx from "./community/ui.jsx?raw";
import cmDataJsx from "./community/data.js?raw";
import cmIconsJsx from "./community/icons.jsx?raw";
import cmCss from "./community/community.css?raw";
import { titleForSub } from "./community/data.js";
import { makeZip } from "./zip.js";

const TFD = "/testing-for-developer";

function stripSlash(p) {
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}

// Maps a testing-ground URL to a folder (and, for the community app, a page).
// Returns null for paths outside the testing ground.
function parseTfd(pathname) {
  const clean = stripSlash(String(pathname || "/"));
  if (clean === TFD) return { folderId: null, sub: null };
  if (!clean.startsWith(`${TFD}/`)) return null;
  const rest = clean.slice(TFD.length + 1);
  const cut = rest.indexOf("/");
  const seg = cut === -1 ? rest : rest.slice(0, cut);
  const tail = cut === -1 ? "" : rest.slice(cut + 1);
  if (seg === "community") return { folderId: "community", sub: tail || "feed" };
  return { folderId: seg || null, sub: null };
}

const VIEWPORTS = [
  { id: "standard", label: "Standard", w: 390, h: 800 },
  { id: "tall", label: "Tall", w: 390, h: 920 },
  { id: "compact", label: "Compact", w: 360, h: 700 },
];

const LB_FILES = [
  { name: "Leaderboard.jsx", content: lbJsx },
  { name: "leaderboard.css", content: lbCss },
];

const SUM_FILES = [
  { name: "Summary.jsx", content: sumJsx },
  { name: "summary.css", content: sumCss },
];

const AI_FILES = [
  { name: "Ai.jsx", content: aiJsx },
  { name: "ai.css", content: aiCss },
];

const CM_FILES = [
  { name: "community/Community.jsx", content: cmAppJsx },
  { name: "community/FeedPages.jsx", content: cmFeedJsx },
  { name: "community/ChatPages.jsx", content: cmChatJsx },
  { name: "community/ui.jsx", content: cmUiJsx },
  { name: "community/data.js", content: cmDataJsx },
  { name: "community/icons.jsx", content: cmIconsJsx },
  { name: "community/community.css", content: cmCss },
];

const FOLDERS = [
  {
    id: "ai",
    title: "AI",
    desc: "Python tutor root state",
    icon: "✦",
    screens: [
      { id: "ai-root", title: "AI · Root State", desc: "Hamburger, Auto model, voice+send, suggestions.", dark: true, Comp: Ai, files: AI_FILES },
    ],
  },
  {
    id: "community",
    title: "Community",
    desc: "Multi-page app with real routes",
    icon: "◉",
    screens: [
      { id: "cm-feed", title: "Activity feed", desc: "Streaks, lessons, badges.", routed: true, entrySub: "feed", Comp: Community, files: CM_FILES },
      { id: "cm-chats", title: "Chats", desc: "Threads with per-chat state.", routed: true, entrySub: "chats", Comp: Community, files: CM_FILES },
      { id: "cm-global", title: "Global chat", desc: "Public room, pinned post.", routed: true, entrySub: "global", Comp: Community, files: CM_FILES },
      { id: "cm-badges", title: "Badges", desc: "Earned and locked medals.", routed: true, entrySub: "badges", Comp: Community, files: CM_FILES },
      { id: "cm-people", title: "People", desc: "Learners with follow.", routed: true, entrySub: "people", Comp: Community, files: CM_FILES },
    ],
  },
  {
    id: "leaderboard",
    title: "Leaderboard",
    desc: "Podium, streaks, league tabs",
    icon: "▲",
    screens: [
      { id: "lb-week", title: "Leaderboard · 7 Days XP", desc: "Weekly board with streaks.", tab: "week", Comp: Leaderboard, files: LB_FILES },
      { id: "lb-all", title: "Leaderboard · All Time", desc: "All-time board with streaks.", tab: "all", Comp: Leaderboard, files: LB_FILES },
    ],
  },
  {
    id: "recap",
    title: "Recap",
    desc: "Dropdown lessons with PDF previews",
    icon: "≡",
    screens: [
      { id: "rc-main", title: "Recap lists", desc: "Units, inline lessons, PDF viewer.", dark: true, Comp: Recap, files: [{ name: "Recap.jsx", content: rcJsx }, { name: "recap.css", content: rcCss }] },
    ],
  },
  {
    id: "summary",
    title: "Summary",
    desc: "Lesson notes with PDF reader",
    icon: "✎",
    screens: [
      { id: "sum-strings", title: "Summary · Strings", desc: "Fade header, PDF block, full reader, notes.", dark: true, Comp: Summary, files: SUM_FILES },
    ],
  },
  {
    id: "supporters",
    title: "Supporters Wall",
    desc: "Monthly donor wall targets",
    icon: "♥",
    screens: [
      { id: "sw-main", title: "Supporters Wall", desc: "Spotlight, ranked donors, foot CTA.", Comp: SupportersWall, files: [{ name: "SupportersWall.jsx", content: swJsx }, { name: "supporters-wall.css", content: swCss }] },
    ],
  },
];

function FolderIcon({ glyph }) {
  return (
    <span className="tst-folder-icon" aria-hidden="true">
      {glyph}
    </span>
  );
}

export default function Testing() {
  const [path, setPath] = useState(() => window.location.pathname);
  const [folderId, setFolderId] = useState(null);
  const [localScreenId, setLocalScreenId] = useState(null);
  const [viewport, setViewport] = useState("standard");
  const [theme, setTheme] = useState("light");
  const [zipping, setZipping] = useState(false);
  // Wind-down stack for the routed community app: how many entries we pushed
  // on top of the testing home, and whether the home is actually below us.
  const depthRef = useRef(0);
  const baseRef = useRef(false);

  useEffect(() => {
    const onPop = () => {
      const st = window.history.state || {};
      depthRef.current = Number(st.depth) || 0;
      baseRef.current = st.base === true;
      setPath(window.location.pathname);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 700px)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 700px)");
    const onChange = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  const parsed = parseTfd(path) || { folderId: null, sub: null };
  const routedSub = parsed.folderId === "community" ? parsed.sub : null;
  const folder = routedSub !== null
    ? FOLDERS.find((f) => f.id === "community") || null
    : (folderId ? FOLDERS.find((f) => f.id === folderId) || null : null);
  const screen = !folder
    ? null
    : routedSub !== null
      ? folder.screens.find((s) => s.entrySub === routedSub.split("/")[0]) || folder.screens[0]
      : folder.screens.find((s) => s.id === localScreenId) || null;
  const vp = VIEWPORTS.find((v) => v.id === viewport) || VIEWPORTS[0];

  const openScreen = (s) => {
    setViewport("standard");
    setTheme("light");
    window.scrollTo(0, 0);
    if (s.routed && s.entrySub) {
      const url = `${TFD}/community/${s.entrySub}`;
      depthRef.current = 1;
      baseRef.current = true;
      window.history.pushState({ tfd: "child", depth: 1, base: true }, "", url);
      setPath(url);
      return;
    }
    setLocalScreenId(s.id);
  };

  const navCommunity = useCallback((nextSub) => {
    const clean = String(nextSub || "feed").replace(/^\/+|\/+$/g, "") || "feed";
    const url = `${TFD}/community/${clean}`;
    const d = depthRef.current > 0 ? depthRef.current + 1 : 1;
    depthRef.current = d;
    window.history.pushState({ tfd: "sub", depth: d, base: baseRef.current }, "", url);
    setPath(url);
  }, []);

  const closeScreen = () => {
    if (routedSub !== null) {
      if (baseRef.current && depthRef.current > 0) {
        window.history.go(-depthRef.current);
      } else {
        depthRef.current = 0;
        baseRef.current = false;
        window.history.replaceState({}, "", TFD);
        setPath(TFD);
      }
      return;
    }
    setLocalScreenId(null);
  };

  const downloadZip = () => {
    if (!screen || !screen.files || zipping) return;
    setZipping(true);
    try {
      const blob = makeZip(screen.files);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${screen.id}-source.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch (err) {
      window.console.debug("zip download skipped", err);
    }
    setZipping(false);
  };

  // On phones a community link opens as the app itself: no testing chrome,
  // no overlay, no deck — just the full-screen mobile view.
  if (routedSub !== null && isMobile) {
    return (
      <div className="tst-mobile">
        <Community sub={routedSub} onNav={navCommunity} />
      </div>
    );
  }

  return (
    <div className="tst-page">
      <div className="tst-inner">
        <p className="tst-secret rise">SECRET · DEVELOPERS ONLY</p>
        <h1 className="tst-title rise d1">Testing ground</h1>
        <p className="tst-sub rise d2">
          {folder
            ? folder.desc
            : "Mobile design targets. Open a folder, then a screen for the full-size fixed look."}
        </p>

        {!folder ? (
          <div className="tst-grid">
            {FOLDERS.map((f, i) => (
              <button
                key={f.id}
                type="button"
                className={`tst-folder-card rise d${Math.min(i + 1, 4)}`}
                onClick={() => {
                  setFolderId(f.id);
                  window.scrollTo(0, 0);
                }}
              >
                <FolderIcon glyph={f.icon} />
                <span className="tst-folder-title">{f.title}</span>
                <span className="tst-folder-meta">
                  {f.screens.length} screens · {f.desc}
                </span>
                <span className="tst-folder-go" aria-hidden="true">▸</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <button
              type="button"
              className="flag-btn tst-back"
              onClick={() => {
                setFolderId(null);
                window.scrollTo(0, 0);
              }}
            >
              <span>← All folders</span>
            </button>
            <h2 className="tst-folder-head rise">
              {folder.title}
              <span className="count-pill">{folder.screens.length}</span>
            </h2>
            <div className="tst-grid">
              {folder.screens.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  className={`tst-screen-card rise d${Math.min(i + 1, 4)}`}
                  onClick={() => openScreen(s)}
                >
                  <span className="tst-thumb" aria-hidden="true">
                    <span className="tst-thumb-bar" />
                    <span className="tst-thumb-bar short" />
                    <span className="tst-thumb-pill" />
                  </span>
                  <span className="tst-screen-title">{s.title}</span>
                  <span className="tst-screen-desc">{s.desc}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {screen && (
        <div className="tst-overlay" onClick={closeScreen}>
          <div
            className={theme === "dark" && screen.dark ? "tst-phone dark" : "tst-phone"}
            role="dialog"
            aria-modal="true"
            aria-label={screen.title}
            onClick={(e) => e.stopPropagation()}
            style={{ width: `min(${vp.w}px, 94vw)`, height: `min(${vp.h}px, 92vh)` }}
          >
            <div className="tst-notch" aria-hidden="true" />
            <button
              type="button"
              className="modal-close tst-close"
              aria-label="Close preview"
              onClick={closeScreen}
            >
              ✕
            </button>
            <p className="tst-phone-title">{screen.routed ? titleForSub(routedSub) : screen.title}</p>
            <div className="tst-phone-screen">
              {screen.routed ? (
                <screen.Comp sub={routedSub} onNav={navCommunity} />
              ) : (
                <screen.Comp tab={screen.tab} />
              )}
            </div>
          </div>
          <div className="tst-deck" onClick={(e) => e.stopPropagation()}>
            <p className="tst-deck-kicker">CONTROLS</p>
            <p className="tst-deck-label">Viewport</p>
            <div className="tst-deck-row" role="group" aria-label="Viewport size">
              {VIEWPORTS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={viewport === v.id ? "tst-chip on" : "tst-chip"}
                  onClick={() => setViewport(v.id)}
                  aria-pressed={viewport === v.id}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <p className="tst-deck-label">Source</p>
            <button
              type="button"
              className="tst-dl"
              onClick={downloadZip}
              disabled={zipping || !screen.files}
            >
              {zipping ? "ZIPPING…" : "⭳ DOWNLOAD ZIP"}
            </button>
            {screen.dark ? (
              <>
                <p className="tst-deck-label">Theme</p>
                <div className="tst-deck-row" role="group" aria-label="Color theme">
                  {["light", "dark"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={theme === t ? "tst-chip on" : "tst-chip"}
                      onClick={() => setTheme(t)}
                      aria-pressed={theme === t}
                    >
                      {t === "light" ? "☀ Light" : "☾ Dark"}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
