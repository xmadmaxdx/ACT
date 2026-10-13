// Sessions drawer: search, sort, New chat, sectioned rows (Today /
// Yesterday / Older) with counts and model badges, multi-select action bar,
// per-row options, live agent-status box, and the user row with the gear
// that opens global settings.

import { useState } from "react";
import { MCP_SERVERS, TASK_LIST } from "./data.js";
import {
  ArchiveIcon,
  CheckIcon,
  EditIcon,
  GearIcon,
  PinIcon,
  PlusIcon,
  DotsIcon,
  SearchIcon,
  TrashIcon,
} from "./icons.jsx";
import { AgRow, AgSheet } from "./bits.jsx";

function sectionOf(time) {
  if (time === "Yesterday") return "Yesterday";
  if (/m$|h$/.test(time) || time === "now") return "Today";
  return "Older";
}

export function AgentDrawer({
  open,
  onClose,
  sessions,
  activeId,
  onOpen,
  onNew,
  onRename,
  onTogglePin,
  onArchive,
  onDelete,
  onSettings,
  onFiles,
  toast,
}) {
  const [q, setQ] = useState("");
  const [sortAz, setSortAz] = useState(false);
  const [menuFor, setMenuFor] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState({});
  const [tasksOpen, setTasksOpen] = useState(false);
  const [mcpOpen, setMcpOpen] = useState(false);
  const [schedPaused, setSchedPaused] = useState(false);

  if (!open) return null;

  const needle = q.trim().toLowerCase();
  const match = (s) => (needle ? s.title.toLowerCase().includes(needle) : true);
  const live = sessions.filter((s) => !s.archived && match(s));
  const archived = sessions.filter((s) => s.archived && match(s));
  const pinned = live.filter((s) => s.pinned);
  const rest = live.filter((s) => !s.pinned);
  const byName = (a, b) => a.title.localeCompare(b.title);
  const ordered = sortAz ? [...pinned, ...rest].sort(byName) : [...pinned, ...rest];
  const groups = ["Today", "Yesterday", "Older"]
    .map((g) => ({ name: g, rows: ordered.filter((s) => sectionOf(s.time) === g) }))
    .filter((g) => g.rows.length > 0);
  const pickedIds = Object.keys(picked).filter((id) => picked[id]);

  const commitRename = () => {
    if (renaming && renameVal.trim()) onRename(renaming, renameVal.trim().slice(0, 40));
    setRenaming(null);
  };

  const togglePick = (id) => {
    setPicked((p) => {
      const next = { ...p };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  };

  const clearSelection = () => {
    setSelecting(false);
    setPicked({});
  };

  const row = (s) => (
    <div key={s.id} style={{ position: "relative" }}>
      <button
        type="button"
        className={
          (s.id === activeId && !selecting ? "ag-srow on" : "ag-srow") + (picked[s.id] ? " picked" : "")
        }
        onClick={() => {
          if (selecting) {
            togglePick(s.id);
            return;
          }
          setMenuFor(null);
          onOpen(s.id);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenuFor(s.id);
        }}
      >
        {selecting ? (
          <span className="ag-check" aria-hidden="true">
            {picked[s.id] ? <CheckIcon /> : null}
          </span>
        ) : null}
        <span className="ag-srow-b">
          <span className="ag-srow-t">
            {s.pinned ? (
              <span className="pin">
                <PinIcon />
              </span>
            ) : null}
            {renaming === s.id ? (
              <input
                value={renameVal}
                autoFocus
                maxLength={40}
                aria-label="Session name"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setRenameVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setRenaming(null);
                }}
                onBlur={commitRename}
                style={{
                  width: "100%",
                  font: "inherit",
                  border: "2px solid var(--blue-light-border)",
                  borderRadius: 8,
                  padding: "2px 6px",
                }}
              />
            ) : (
              s.title
            )}
            {s.model ? <span className="ag-modelbadge">{s.model}</span> : null}
          </span>
          <span className="ag-srow-p">{s.preview}</span>
          <span className="ag-srow-meta">{typeof s.count === "number" ? `${s.count} msgs` : ""}</span>
        </span>
        <span className="ag-srow-time">{s.time}</span>
        {!selecting ? (
          <span
            role="button"
            tabIndex={0}
            className="ag-srow-dots"
            aria-label={`Options for ${s.title}`}
            onClick={(e) => {
              e.stopPropagation();
              setMenuFor((f) => (f === s.id ? null : s.id));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                setMenuFor((f) => (f === s.id ? null : s.id));
              }
            }}
          >
            <DotsIcon />
          </span>
        ) : null}
      </button>
      {menuFor === s.id && !selecting ? (
        <div className="ag-rowmenu" role="menu" aria-label="Session options">
          <button
            type="button"
            className="ag-mi"
            onClick={() => {
              setMenuFor(null);
              onTogglePin(s.id);
            }}
          >
            <PinIcon /> {s.pinned ? "Unpin" : "Pin"}
          </button>
          <button
            type="button"
            className="ag-mi"
            onClick={() => {
              setMenuFor(null);
              setRenameVal(s.title);
              setRenaming(s.id);
            }}
          >
            <EditIcon /> Rename
          </button>
          <button
            type="button"
            className="ag-mi"
            onClick={() => {
              setMenuFor(null);
              onArchive(s.id);
            }}
          >
            <ArchiveIcon /> {s.archived ? "Unarchive" : "Archive"}
          </button>
          <button
            type="button"
            className="ag-mi danger"
            onClick={() => {
              setMenuFor(null);
              onDelete(s.id);
            }}
          >
            <TrashIcon /> Delete
          </button>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="ag-scrim" onClick={onClose}>
      <div
        className="ag-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Sessions"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ag-d-head">
          <div className="ag-d-search">
            <span className="ic">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search sessions"
              aria-label="Search sessions"
              maxLength={40}
            />
          </div>
          <button type="button" className="ag-d-new" onClick={onNew}>
            <PlusIcon /> New chat
          </button>
        </div>

        <div className="ag-d-list">
          <div className="ag-d-sec ag-d-sechead">
            <span>Chats</span>
            <button
              type="button"
              className="ag-sortbtn"
              onClick={() => setSortAz((v) => !v)}
              aria-pressed={sortAz}
            >
              {sortAz ? "A–Z" : "Recent"}
            </button>
            <button
              type="button"
              className="ag-sortbtn"
              onClick={() => (selecting ? clearSelection() : setSelecting(true))}
              aria-pressed={selecting}
            >
              {selecting ? "Done" : "Select"}
            </button>
          </div>
          {groups.length === 0 && archived.length === 0 ? (
            <p className="ag-srow-p" style={{ padding: "8px 4px" }}>
              {needle ? `Nothing matches “${q.trim()}”.` : "No chats yet."}
            </p>
          ) : (
            groups.map((g) => (
              <div key={g.name}>
                <div className="ag-d-sec">{g.name}</div>
                {g.rows.map(row)}
              </div>
            ))
          )}

          <div className="ag-d-sec">Agent</div>
          <div className="ag-agentbox">
            <button
              type="button"
              className="ag-agentrow"
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit", textAlign: "left" }}
              onClick={() => setTasksOpen(true)}
            >
              <span className="pulse" />
              Tests running
              <span className="due">62%</span>
            </button>
            <div className="ag-agentrow">
              <span className="bar">
                <i style={{ width: "62%" }} />
              </span>
            </div>
            <div className="ag-agentrow">
              <span className="due" style={{ marginLeft: 0 }}>
                Nightly audit · {schedPaused ? "paused" : "due in 2h"}
              </span>
              <button
                type="button"
                className="ag-linkbtn"
                style={{ marginLeft: "auto" }}
                onClick={() => setSchedPaused((v) => !v)}
                aria-pressed={schedPaused}
              >
                {schedPaused ? "Resume" : "Pause"}
              </button>
            </div>
            <button
              type="button"
              className="ag-agentrow"
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit", textAlign: "left" }}
              onClick={() => setMcpOpen(true)}
            >
              <span className="pulse" style={{ background: "var(--blue)" }} />
              3 MCP servers · 12 tools
            </button>
            <button
              type="button"
              className="ag-agentrow"
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit", textAlign: "left" }}
              onClick={onFiles}
            >
              <span className="pulse" style={{ background: "var(--ag-amber-solid)" }} />
              Workspace files
            </button>
          </div>

          {archived.length > 0 ? (
            <>
              <button type="button" className="ag-srow" onClick={() => setShowArchived((v) => !v)} aria-expanded={showArchived}>
                <span className="ag-srow-b">
                  <span className="ag-srow-t">
                    <ArchiveIcon /> Archived ({archived.length})
                  </span>
                </span>
              </button>
              {showArchived ? archived.map(row) : null}
            </>
          ) : null}
        </div>

        {selecting ? (
          <div className="ag-selectbar">
            <span>{pickedIds.length} picked</span>
            <span style={{ flex: 1 }} />
            <button
              type="button"
              onClick={() => {
                pickedIds.forEach((id) => onArchive(id));
                clearSelection();
              }}
              disabled={pickedIds.length === 0}
            >
              Archive
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => {
                pickedIds.forEach((id) => onDelete(id));
                clearSelection();
              }}
              disabled={pickedIds.length === 0}
            >
              Delete
            </button>
          </div>
        ) : (
          <div className="ag-d-foot">
            <span className="ag-avatar" aria-hidden="true">
              Y
            </span>
            <span className="ag-d-user">
              <b>You</b>
              <span>Pro · connected</span>
            </span>
            <button type="button" className="ag-gear" onClick={onSettings} aria-label="Settings">
              <GearIcon />
            </button>
          </div>
        )}
      </div>

      {tasksOpen ? (
        <AgSheet title="Background tasks" onClose={() => setTasksOpen(false)}>
          {TASK_LIST.map((t) => (
            <AgRow
              key={t.id}
              title={t.name}
              sub={t.status === "run" ? `${t.progress}%` : t.status}
              right={
                t.status === "run" ? (
                  <button type="button" className="ag-linkbtn" onClick={() => toast("Cancelled")}>
                    Cancel
                  </button>
                ) : t.status === "done" ? (
                  <button type="button" className="ag-linkbtn" onClick={() => toast("Opened result")}>
                    Open
                  </button>
                ) : null
              }
            />
          ))}
        </AgSheet>
      ) : null}

      {mcpOpen ? (
        <AgSheet title="MCP servers" onClose={() => setMcpOpen(false)}>
          {MCP_SERVERS.map((m) => (
            <AgRow
              key={m.id}
              title={m.name}
              sub={`${m.tools} tools`}
              right={<span className={m.on ? "ag-mcpdot" : "ag-mcpdot off"} title={m.on ? "Connected" : "Off"} />}
            />
          ))}
        </AgSheet>
      ) : null}
    </div>
  );
}
