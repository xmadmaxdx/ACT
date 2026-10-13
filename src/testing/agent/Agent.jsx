// Codino Agent root: ChatGPT-like shell with a routed main view (root /
// thread / settings), drawer with live sessions, top-bar ⋯ window, model and
// quota sheets, and undoable deletes.

import { useCallback, useEffect, useRef, useState } from "react";
import "./agent.css";
import { MODELS, SESSIONS, THREAD_SEED, stamp } from "./data.js";
import {
  ArchiveIcon,
  BackIcon,
  CopyIcon,
  DotsIcon,
  DownloadIcon,
  MenuIcon,
  PencilIcon,
  RetryIcon,
  ShareIcon,
  SparkIcon,
  TrashIcon,
} from "./icons.jsx";
import { RootView } from "./RootView.jsx";
import { ThreadView } from "./ThreadView.jsx";
import { AgentDrawer } from "./AgentDrawer.jsx";
import { SettingsView } from "./SettingsView.jsx";
import { WelcomeView } from "./WelcomeView.jsx";
import { FilesView } from "./FilesView.jsx";
import { AgSheet } from "./bits.jsx";

function cloneSeed() {
  return THREAD_SEED.map((m) => ({
    ...m,
    tools: (m.tools || []).map((t) => ({ ...t })),
    branches: m.branches ? [...m.branches] : undefined,
    subagent: m.subagent ? { ...m.subagent } : undefined,
    code: m.code ? { ...m.code } : undefined,
    diff: m.diff ? { ...m.diff } : undefined,
    context: m.context ? { ...m.context } : undefined,
    stats: m.stats ? { ...m.stats } : undefined,
  }));
}

async function copyText(s) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(s);
      return true;
    }
  } catch (err) {
    window.console.debug("agent copy skipped", err);
  }
  return false;
}

export default function Agent({ sub, onNav }) {
  const segs = String(sub || "").split("/");
  const [sessions, setSessions] = useState(SESSIONS);
  const [threads, setThreads] = useState(() => ({ s1: cloneSeed() }));
  const [drafts, setDrafts] = useState({});
  const [drawer, setDrawer] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modelSheet, setModelSheet] = useState(false);
  const [quota, setQuota] = useState(false);
  const [model, setModel] = useState("auto");
  const [toastMsg, setToastMsg] = useState(null);
  const [toastAct, setToastAct] = useState(null);
  const [settingsReturn, setSettingsReturn] = useState("");
  const [online, setOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine !== false
  );
  const [queued, setQueued] = useState({});
  const threadApi = useRef(null);
  const idRef = useRef(0);
  const toastTimer = useRef(null);
  const trash = useRef(null);
  const scrollPos = useRef({});
  const queuedRef = useRef({});
  queuedRef.current = queued;

  const toast = useCallback((msg, action) => {
    setToastMsg(msg);
    setToastAct(action || null);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => {
      setToastMsg(null);
      setToastAct(null);
    }, action ? 5000 : 1800);
  }, []);

  const goOnline = useCallback(() => {
    setOnline(true);
    const ids = Object.keys(queuedRef.current);
    if (ids.length > 0) {
      setThreads((tp) => {
        const cp = { ...tp };
        for (const id of ids) {
          cp[id] = (cp[id] || []).map((m) => (m.queued ? { ...m, queued: false } : m));
        }
        return cp;
      });
      setQueued({});
    }
    toast("Back online · queue sent");
    window.setTimeout(() => {
      if (threadApi.current && threadApi.current.flush) threadApi.current.flush();
    }, 350);
  }, [toast]);

  const goOffline = useCallback(() => {
    setOnline(false);
    toast("Offline · messages will queue");
  }, [toast]);

  useEffect(() => {
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [goOnline, goOffline]);

  const isThread = segs[0] === "s" && !!segs[1];
  const isSettings = segs[0] === "settings";
  const isFiles = segs[0] === "files";
  const isWelcome = segs[0] === "welcome";
  const sessionId = isThread ? segs[1] : null;
  const session = sessionId ? sessions.find((s) => s.id === sessionId) || null : null;
  const modelName = (MODELS.find((m) => m.id === model) || MODELS[0]).name;
  const queuedCount = Object.values(queued).reduce((a, b) => a + b, 0);

  const setDraft = useCallback((id, v) => {
    setDrafts((prev) => ({ ...prev, [id]: v }));
  }, []);

  const pushMsg = useCallback((id, msg) => {
    setThreads((prev) => ({ ...prev, [id]: [...(prev[id] || []), msg] }));
  }, []);

  const patchMsg = useCallback((id, msgId, p) => {
    setThreads((prev) => ({
      ...prev,
      [id]: (prev[id] || []).map((m) => (m.id === msgId ? { ...m, ...p } : m)),
    }));
  }, []);

  const bumpQueue = useCallback((id) => {
    setQueued((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }, []);

  const saveScroll = useCallback((id, pos) => {
    scrollPos.current[id] = pos;
  }, []);

  const sendFromRoot = useCallback(
    (text, attach) => {
      idRef.current += 1;
      const id = `s${Date.now().toString(36)}${idRef.current}`;
      const title = text.length > 26 ? `${text.slice(0, 26)}…` : text;
      const offlineNow = typeof navigator !== "undefined" && navigator.onLine === false;
      const um = {
        id: `u${idRef.current}`,
        role: "user",
        text,
        time: stamp(),
        attach: attach ? { ...attach } : undefined,
        queued: offlineNow || undefined,
      };
      setSessions((prev) => [
        { id, title, preview: text.slice(0, 34), time: "now", count: 1, model: "1" },
        ...prev,
      ]);
      setThreads((prev) => ({ ...prev, [id]: [um] }));
      if (offlineNow) {
        setQueued((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
        toast("Queued · sends on reconnect");
      }
      onNav(`s/${id}`);
    },
    [onNav, toast]
  );

  const openSession = useCallback(
    (id) => {
      setDrawer(false);
      if (id !== sessionId) onNav(`s/${id}`);
    },
    [onNav, sessionId]
  );

  const openSettings = useCallback(() => {
    setDrawer(false);
    setMenuOpen(false);
    setSettingsReturn(sub || "");
    onNav("settings");
  }, [onNav, sub]);

  const renameSession = useCallback(
    (id, title) => {
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
      toast("Renamed");
    },
    [toast]
  );

  const togglePin = useCallback(
    (id) => {
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s)));
      toast("Updated");
    },
    [toast]
  );

  const archiveSession = useCallback(
    (id) => {
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, archived: !s.archived } : s)));
      toast("Archived");
    },
    [toast]
  );

  const deleteSession = useCallback(
    (id) => {
      const s = sessions.find((x) => x.id === id) || null;
      if (!s) return;
      trash.current = { session: s, msgs: threads[id] || [] };
      setSessions((prev) => prev.filter((x) => x.id !== id));
      setThreads((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (id === sessionId) onNav("");
      toast("Chat deleted", {
        label: "Undo",
        fn: () => {
          const t = trash.current;
          if (!t) return;
          setSessions((prev) => [t.session, ...prev]);
          setThreads((prev) => ({ ...prev, [t.session.id]: t.msgs }));
          trash.current = null;
        },
      });
    },
    [sessions, threads, sessionId, onNav, toast]
  );

  const menuAction = async (kind) => {
    setMenuOpen(false);
    if (kind === "regen") threadApi.current?.regenerate();
    else if (kind === "copy") threadApi.current?.copyThread();
    else if (kind === "export") toast("Exported thread.md");
    else if (kind === "share") {
      const ok = await copyText(`https://codino.dev/share/${sessionId || "new"}`);
      toast(ok ? "Link copied" : "Copy failed");
    } else if (kind === "archive" && sessionId) archiveSession(sessionId);
    else if (kind === "delete" && sessionId) deleteSession(sessionId);
  };

  const menuItems = [
    { id: "regen", icon: <RetryIcon />, label: "Regenerate" },
    { id: "copy", icon: <CopyIcon />, label: "Copy thread" },
    { id: "export", icon: <DownloadIcon />, label: "Export Markdown" },
    { id: "share", icon: <ShareIcon />, label: "Share" },
  ];
  const dangerItems = [
    { id: "archive", icon: <ArchiveIcon />, label: "Archive" },
    { id: "delete", icon: <TrashIcon />, label: "Delete", danger: true },
  ];

  const openFiles = useCallback(() => {
    setDrawer(false);
    setMenuOpen(false);
    setSettingsReturn(sub || "");
    onNav("files");
  }, [onNav, sub]);

  return (
    <div className="ag-app">
      {isWelcome ? (
        <WelcomeView onDone={() => onNav("")} />
      ) : (
        <>
          <header className="ag-head rise">
            {isSettings || isFiles ? (
              <>
                <button type="button" className="ag-iconbtn" onClick={() => onNav(settingsReturn)} aria-label="Back">
                  <BackIcon />
                </button>
                <div className="ag-h-b left">
                  <h1 className="ag-h-title">{isFiles ? "Files" : "Settings"}</h1>
                </div>
              </>
            ) : (
              <>
                <button type="button" className="ag-iconbtn" onClick={() => setDrawer(true)} aria-label="Open sessions">
                  <MenuIcon />
                </button>
                <div className="ag-h-b">
                  <button type="button" className="ag-model" onClick={() => setModelSheet(true)} aria-label={`Model: ${modelName}`}>
                    <SparkIcon size={14} />
                    <span>{modelName}</span>
                  </button>
                </div>
                {isThread ? (
                  <>
                    <button type="button" className="ag-iconbtn accent" onClick={() => onNav("")} aria-label="New chat">
                      <PencilIcon />
                    </button>
                    <button
                      type="button"
                      className="ag-iconbtn"
                      onClick={() => setMenuOpen((v) => !v)}
                      aria-label="Thread options"
                      aria-expanded={menuOpen}
                    >
                      <DotsIcon />
                    </button>
                  </>
                ) : (
                  <button type="button" className="ag-iconbtn plain" onClick={() => setQuota(true)} aria-label="Codino quota">
                    <SparkIcon size={20} />
                  </button>
                )}
              </>
            )}
            {menuOpen && isThread ? (
              <div className="ag-menu" role="menu" aria-label="Thread options">
                {menuItems.map((m) => (
                  <button key={m.id} type="button" className="ag-mi" onClick={() => menuAction(m.id)}>
                    <span className="lic">{m.icon}</span>
                    {m.label}
                  </button>
                ))}
                <hr />
                {dangerItems.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={m.danger ? "ag-mi danger" : "ag-mi"}
                    onClick={() => menuAction(m.id)}
                  >
                    <span className="lic">{m.icon}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            ) : null}
          </header>
          {menuOpen ? (
            <button type="button" className="ag-catch" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          ) : null}
          {!online ? (
            <div className="ag-offbar" role="status">
              <span className="pulse" />
              Offline{queuedCount > 0 ? ` · ${queuedCount} queued` : ""}
            </div>
          ) : null}

          {isSettings ? (
            <div className="ag-body">
              <SettingsView toast={toast} />
            </div>
          ) : isFiles ? (
            <FilesView toast={toast} />
          ) : isThread && session ? (
            <ThreadView
              key={session.id}
              sessionId={session.id}
              msgs={threads[session.id] || []}
              onPush={(m) => pushMsg(session.id, m)}
              onPatch={(mid, p) => patchMsg(session.id, mid, p)}
              draft={drafts[session.id] || ""}
              setDraft={(v) => setDraft(session.id, v)}
              toast={toast}
              apiRef={threadApi}
              offline={!online}
              onQueue={() => bumpQueue(session.id)}
              initialScroll={scrollPos.current[session.id] || 0}
              onScrollSave={(pos) => saveScroll(session.id, pos)}
            />
          ) : (
            <RootView onSend={sendFromRoot} />
          )}

          <AgentDrawer
            open={drawer}
            onClose={() => setDrawer(false)}
            sessions={sessions}
            activeId={sessionId}
            onOpen={openSession}
            onNew={() => {
              setDrawer(false);
              onNav("");
            }}
            onRename={renameSession}
            onTogglePin={togglePin}
            onArchive={archiveSession}
            onDelete={deleteSession}
            onSettings={openSettings}
            onFiles={openFiles}
            toast={toast}
          />
        </>
      )}

      {modelSheet ? (
        <AgSheet title="Model" onClose={() => setModelSheet(false)}>
          {MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={model === m.id ? "ag-sheetrow on" : "ag-sheetrow"}
              onClick={() => {
                setModel(m.id);
                setModelSheet(false);
              }}
            >
              <span className="ag-sheet-l">
                <span className="ag-sheet-t">
                  {m.name} · {m.tag}
                </span>
                <span className="ag-sheet-s">{m.desc}</span>
              </span>
            </button>
          ))}
        </AgSheet>
      ) : null}

      {quota ? (
        <AgSheet title="Your quota" onClose={() => setQuota(false)}>
          <div className="ag-health" style={{ justifyContent: "center", fontSize: 26 }}>
            38 / 50
          </div>
          <p className="ag-empty-s" style={{ textAlign: "center", maxWidth: "100%" }}>
            Refills daily at midnight.
          </p>
        </AgSheet>
      ) : null}

      {toastMsg ? (
        <p className="ag-toast" role="status">
          {toastMsg}
          {toastAct ? (
            <button
              type="button"
              onClick={() => {
                toastAct.fn();
                setToastMsg(null);
                setToastAct(null);
                if (toastTimer.current) window.clearTimeout(toastTimer.current);
              }}
            >
              {toastAct.label}
            </button>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
