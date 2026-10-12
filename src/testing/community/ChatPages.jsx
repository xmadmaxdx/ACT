// Community chat pages: Chats list, 1:1 Thread and GlobalChat.
// Every message exposes owner-aware controls through an anchored menu:
// mine → react / copy / reply / edit / forward / delete,
// theirs → react / copy / reply / forward / report / delete-for-me.

import { useEffect, useRef, useState } from "react";
import { CHATS, GLOBAL_REPLIES, ME, fmtDur, makePeaks, personById, replyFor, stamp } from "./data.js";
import {
  Avatar,
  ChatIcon,
  CheckIcon,
  CloseIcon,
  CopyIcon,
  DotsIcon,
  DoubleCheckIcon,
  EditIcon,
  FileIcon,
  FlagIcon,
  ForwardIcon,
  MicIcon,
  PauseIcon,
  PhotoIcon,
  PlayIcon,
  PlusIcon,
  ReplyIcon,
  SearchIcon,
  SendIcon,
  TrashIcon,
} from "./icons.jsx";
import { Empty, Head, Seg, Sheet } from "./ui.jsx";

const QUICK_EMOJI = ["❤️", "😂", "🎉", "🔥", "👍", "😮"];

function replyNameOf(who) {
  if (who === ME) return "You";
  const p = personById(who);
  return p ? p.name.split(" ")[0] : "Them";
}

function previewOf(m) {
  if (!m) return "No messages yet";
  if (m.deleted) return "Message deleted";
  if (m.kind === "voice") return `🎙 Voice · ${fmtDur(m.dur)}`;
  if (m.kind === "photo") return "📷 Photo";
  if (m.kind === "file") return `📄 ${m.file ? m.file.name : "File"}`;
  return m.text || "";
}

function PhotoArt({ seed }) {
  let h = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const gid = `cmg${h % 9973}`;
  const hue = h % 360;
  return (
    <svg viewBox="0 0 240 140" width="100%" height="auto" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={`hsl(${hue}, 82%, 72%)`} />
          <stop offset="1" stopColor={`hsl(${(hue + 50) % 360}, 85%, 52%)`} />
        </linearGradient>
      </defs>
      <rect width="240" height="140" fill={`url(#${gid})`} />
      <circle cx={52 + (h % 120)} cy="38" r="17" fill="#fff" opacity="0.85" />
      <path d="M0 118 L70 52 L120 104 L168 60 L240 128 L240 140 L0 140 Z" fill="rgba(255,255,255,0.35)" />
      <path d="M0 128 L90 74 L150 118 L205 88 L240 112 L240 140 L0 140 Z" fill="rgba(0,0,0,0.18)" />
    </svg>
  );
}

function VoiceBody({ m, playing, playPos, onTogglePlay }) {
  const peaks = m.peaks || [];
  const left = playing ? Math.max(0, (m.dur || 0) - playPos * (m.dur || 0)) : m.dur || 0;
  return (
    <span className="cm-voice">
      <button
        type="button"
        className="cm-vplay"
        onClick={() => onTogglePlay(m)}
        aria-label={playing ? "Pause voice note" : `Play voice note, ${fmtDur(m.dur)}`}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <span className="cm-wave" aria-hidden="true">
        {peaks.map((p, i) => (
          <i
            key={i}
            style={{ height: `${Math.round(p * 100)}%` }}
            className={playing && i / peaks.length < playPos ? "on" : ""}
          />
        ))}
      </span>
      <span className="cm-vdur">{fmtDur(left)}</span>
    </span>
  );
}

function FileBody({ m }) {
  return (
    <span className="cm-filecard">
      <span className="cm-file-ic">
        <FileIcon />
      </span>
      <span className="cm-file-b">
        <span className="cm-file-n">{m.file ? m.file.name : "File"}</span>
        <span className="cm-file-s">
          {m.file ? m.file.type : "FILE"} · {m.file ? m.file.size : ""}
        </span>
      </span>
    </span>
  );
}

function Menu({ mine, textable, reported, myReacted, onPick, onReact }) {
  return (
    <div className={mine ? "cm-menu right" : "cm-menu left"} role="menu" aria-label="Message options">
      <div className="cm-reactrow" role="group" aria-label="Quick reactions">
        {QUICK_EMOJI.map((e) => (
          <button
            key={e}
            type="button"
            className={myReacted === e ? "on" : ""}
            onClick={() => onReact(e)}
            aria-label={`React ${e}`}
          >
            {e}
          </button>
        ))}
      </div>
      {textable ? (
        <button type="button" className="cm-mi" onClick={() => onPick("copy")}>
          <CopyIcon /> Copy
        </button>
      ) : null}
      <button type="button" className="cm-mi" onClick={() => onPick("reply")}>
        <ReplyIcon /> Reply
      </button>
      {mine && textable ? (
        <button type="button" className="cm-mi" onClick={() => onPick("edit")}>
          <EditIcon /> Edit
        </button>
      ) : null}
      <button type="button" className="cm-mi" onClick={() => onPick("forward")}>
        <ForwardIcon /> Forward
      </button>
      {!mine ? (
        <button type="button" className="cm-mi" disabled={!!reported} onClick={() => onPick("report")}>
          {reported ? <CheckIcon /> : <FlagIcon />}
          {reported ? "Reported ✓" : "Report"}
        </button>
      ) : null}
      <button type="button" className="cm-mi danger" onClick={() => onPick("delete")}>
        <TrashIcon /> {mine ? "Delete" : "Delete for me"}
      </button>
    </div>
  );
}

function MsgRow({
  m,
  mine,
  sender,
  showName,
  menuOpen,
  onToggleMenu,
  onAction,
  onQuickReact,
  playing,
  playPos,
  onTogglePlay,
}) {
  const textable = m.kind === "text" && !m.deleted;
  const myReacts = (m.reactions || []).filter((r) => (r.by || []).includes(ME)).map((r) => r.emoji);
  return (
    <div className="cm-mrow-wrap">
      <div className={mine ? "cm-msg mine" : "cm-msg theirs"}>
        {!mine ? <Avatar person={sender} size={30} /> : null}
        <div className="cm-stack">
          {!mine && showName && sender ? (
            <span className="cm-gname" style={{ color: sender.color }}>
              {sender.name}
            </span>
          ) : null}
          <div className="cm-bubble">
            {m.replyTo && !m.deleted ? (
              <span className="cm-quote">
                <span className="cm-quote-bar" />
                <span className="cm-quote-b">
                  <span className="cm-quote-n">{replyNameOf(m.replyTo.from)}</span>
                  <span className="cm-quote-t">{m.replyTo.text || "Attachment"}</span>
                </span>
              </span>
            ) : null}
            {m.deleted ? (
              <span className="cm-deleted">{mine ? "You deleted this message" : "Message deleted"}</span>
            ) : m.kind === "text" ? (
              <p className="cm-mtext">
                {m.text}
                {m.edited ? <span className="cm-edited"> · edited</span> : null}
              </p>
            ) : m.kind === "voice" ? (
              <VoiceBody m={m} playing={playing} playPos={playPos} onTogglePlay={onTogglePlay} />
            ) : m.kind === "photo" ? (
              <>
                <span className="cm-photo">
                  <PhotoArt seed={m.id} />
                </span>
                {m.text ? <p className="cm-photocap">{m.text}</p> : null}
              </>
            ) : (
              <FileBody m={m} />
            )}
            {menuOpen && !m.deleted ? (
              <Menu
                mine={mine}
                textable={textable}
                reported={m.reported}
                myReacted={myReacts[0] || null}
                onPick={(kind) => onAction(kind, m)}
                onReact={(e) => onQuickReact(m, e)}
              />
            ) : null}
            {menuOpen && m.deleted ? (
              <div className={mine ? "cm-menu right" : "cm-menu left"} role="menu" aria-label="Message options">
                <span className="hint">Nothing to do here</span>
                <button type="button" className="cm-mi danger" onClick={() => onAction("delete", m)}>
                  <TrashIcon /> {mine ? "Delete" : "Delete for me"}
                </button>
              </div>
            ) : null}
          </div>
          {(m.reactions || []).length > 0 ? (
            <span className="cm-reacts">
              {(m.reactions || []).map((r) => (
                <button
                  key={r.emoji}
                  type="button"
                  className={(r.by || []).includes(ME) ? "cm-react mine" : "cm-react"}
                  onClick={() => onQuickReact(m, r.emoji)}
                  aria-label={`Toggle ${r.emoji} reaction`}
                >
                  {r.emoji}
                </button>
              ))}
            </span>
          ) : null}
          <span className="cm-mfoot">
            <button
              type="button"
              className="cm-mbtn"
              onClick={onToggleMenu}
              aria-label="Message options"
              aria-expanded={!!menuOpen}
            >
              <DotsIcon />
            </button>
            <span className="cm-mtime">{m.time}</span>
            {mine && m.status === "read" ? (
              <span className="cm-tick" title="Read">
                <DoubleCheckIcon />
              </span>
            ) : null}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------- Composer ----------------

function newBars() {
  return Array.from({ length: 22 }, () => 5 + Math.round(Math.random() * 22));
}

export function Composer({
  value,
  onChange,
  placeholder,
  replyTo,
  replyName,
  onCancelReply,
  editing,
  onCancelEdit,
  attach,
  onClearAttach,
  onPickAttach,
  onSend,
  onSendVoice,
  canSend,
}) {
  const [sheet, setSheet] = useState(false);
  const [rec, setRec] = useState(null);
  const [bars, setBars] = useState([]);
  const recRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => () => {
    if (recRef.current) window.clearInterval(recRef.current);
  }, []);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 92)}px`;
  }, [value]);

  const startRec = () => {
    setBars(newBars());
    setRec(0);
    recRef.current = window.setInterval(() => {
      setRec((s) => (s === null ? s : s + 0.2));
      setBars(newBars());
    }, 200);
  };

  const stopRec = (sendIt) => {
    if (recRef.current) window.clearInterval(recRef.current);
    recRef.current = null;
    const heard = rec || 0;
    setRec(null);
    if (sendIt && heard >= 0.8) onSendVoice(Math.max(1, Math.round(heard)));
  };

  const pick = (kind) => {
    setSheet(false);
    onPickAttach(kind);
    inputRef.current?.focus();
  };

  return (
    <>
      {replyTo ? (
        <div className="cm-ctxbar">
          <span className="bar" />
          <span className="cm-ctxbar-b">
            <span className="cm-ctxbar-k">Reply to {replyName}</span>
            <span className="cm-ctxbar-t">{replyTo.text || "Attachment"}</span>
          </span>
          <button type="button" className="cm-ctxx" onClick={onCancelReply} aria-label="Cancel reply">
            <CloseIcon />
          </button>
        </div>
      ) : null}
      {editing ? (
        <div className="cm-ctxbar">
          <span className="bar" />
          <span className="cm-ctxbar-b">
            <span className="cm-ctxbar-k">Editing</span>
            <span className="cm-ctxbar-t">{editing.text}</span>
          </span>
          <button type="button" className="cm-ctxx" onClick={onCancelEdit} aria-label="Cancel edit">
            <CloseIcon />
          </button>
        </div>
      ) : null}
      {attach ? (
        <div className="cm-attachprev">
          <span className="cm-attachthumb">{attach.kind === "photo" ? <PhotoIcon /> : <FileIcon />}</span>
          <span className="cm-attachname">{attach.name}</span>
          <button type="button" className="cm-attachx cm-ctxx" onClick={onClearAttach} aria-label="Remove attachment">
            <CloseIcon />
          </button>
        </div>
      ) : null}

      {rec !== null ? (
        <div className="cm-rec" role="status" aria-label="Recording voice note">
          <span className="cm-rec-dot" aria-hidden="true" />
          <span className="cm-rec-t">{fmtDur(rec)}</span>
          <span className="cm-rec-bars" aria-hidden="true">
            {bars.map((h, i) => (
              <i key={i} style={{ height: `${h}px` }} />
            ))}
          </span>
          <button type="button" className="cm-iconbtn" onClick={() => stopRec(false)} aria-label="Cancel recording">
            <CloseIcon />
          </button>
          <button type="button" className="cm-rec-stop" onClick={() => stopRec(true)} aria-label="Send voice note">
            <SendIcon />
          </button>
        </div>
      ) : (
        <div className="cm-composer">
          <button type="button" className="cm-cbtn" onClick={() => setSheet(true)} aria-label="Attach">
            <PlusIcon />
          </button>
          <div className="cm-field">
            <textarea
              ref={inputRef}
              className="cm-input"
              value={value}
              rows={1}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              placeholder={placeholder}
              aria-label={placeholder}
              maxLength={500}
            />
            <button type="button" className="cm-iconbtn" onClick={startRec} aria-label="Record voice note">
              <MicIcon />
            </button>
          </div>
          <button
            type="button"
            className={canSend ? "cm-send on" : "cm-send"}
            onClick={onSend}
            disabled={!canSend}
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </div>
      )}

      {sheet ? (
        <Sheet title="Share" onClose={() => setSheet(false)}>
          <button type="button" className="cm-sheetrow" onClick={() => pick("photo")}>
            <span className="cm-sheet-ic b">
              <PhotoIcon />
            </span>
            <span className="cm-sheet-l">
              <span className="cm-sheet-t">Photo</span>
            </span>
          </button>
          <button type="button" className="cm-sheetrow" onClick={() => pick("file")}>
            <span className="cm-sheet-ic p">
              <FileIcon />
            </span>
            <span className="cm-sheet-l">
              <span className="cm-sheet-t">File</span>
            </span>
          </button>
        </Sheet>
      ) : null}
    </>
  );
}

// ---------------- Chats list ----------------

const CHAT_TABS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
];

export function Chats({ unread, threads, onBack, onNav }) {
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const rows = CHATS.map((c) => {
    const p = personById(c.person);
    const msgs = threads[c.id] || [];
    const last = msgs.length > 0 ? msgs[msgs.length - 1] : null;
    return { c, p, last };
  })
    .filter(({ p }) => !p || needle.length === 0 || p.name.toLowerCase().includes(needle))
    .filter(({ c }) => (tab === "unread" ? (unread[c.id] || 0) > 0 : true));
  return (
    <>
      <Head title="Chats" sub={`${Object.values(unread).reduce((a, b) => a + b, 0)} unread`} onBack={onBack} />
      <div className="cm-body plain">
        <div className="cm-search rise">
          <span className="ic">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search chats"
            aria-label="Search chats"
            maxLength={40}
          />
        </div>
        <Seg options={CHAT_TABS} value={tab} onChange={setTab} label="Chat filter" />
        {rows.length === 0 ? (
          <Empty
            icon={<ChatIcon />}
            title={tab === "unread" ? "All caught up" : "No chats found"}
            sub={tab === "unread" ? "Nothing unread right now." : `Nothing matches “${q.trim()}”.`}
            actionLabel={tab === "unread" ? null : "Clear search"}
            onAction={tab === "unread" ? null : () => setQ("")}
          />
        ) : (
          <div className="cm-list">
            {rows.map(({ c, p, last }, i) => (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                className={`cm-row rise d${Math.min((i % 4) + 1, 4)}`}
                aria-label={`Open chat with ${p ? p.name : "unknown"}`}
                onClick={() => onNav(`chats/${c.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onNav(`chats/${c.id}`);
                  }
                }}
              >
                <Avatar person={p} size={48} dot />
                <span className="cm-row-b">
                  <span className="cm-row-t">
                    <span className="cm-row-name">{p ? p.name : "Unknown"}</span>
                  </span>
                  <span className={unread[c.id] > 0 ? "cm-row-sub unread" : "cm-row-sub"}>
                    {last && last.from === ME ? "You: " : ""}
                    {previewOf(last)}
                  </span>
                </span>
                <span className="cm-row-side">
                  <span className={unread[c.id] > 0 ? "cm-row-time on" : "cm-row-time"}>
                    {last ? last.time : ""}
                  </span>
                  {unread[c.id] > 0 ? <span className="cm-cunread">{unread[c.id]}</span> : null}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ---------------- Shared thread behaviour ----------------

function usePlayback() {
  const [playId, setPlayId] = useState(null);
  const [playPos, setPlayPos] = useState(0);
  const playRef = useRef(null);

  useEffect(
    () => () => {
      if (playRef.current) window.clearInterval(playRef.current);
    },
    []
  );

  const stop = () => {
    if (playRef.current) window.clearInterval(playRef.current);
    playRef.current = null;
    setPlayId(null);
    setPlayPos(0);
  };

  const toggle = (m) => {
    if (!m || m.kind !== "voice") return;
    if (playId === m.id) {
      stop();
      return;
    }
    stop();
    setPlayId(m.id);
    setPlayPos(0);
    const dur = Math.max(1, m.dur || 1);
    const t0 = Date.now();
    playRef.current = window.setInterval(() => {
      const frac = (Date.now() - t0) / 1000 / dur;
      if (frac >= 1) stop();
      else setPlayPos(frac);
    }, 100);
  };

  return { playId, playPos, togglePlay: toggle };
}

function copyText(s) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(s).then(() => true, () => false);
  return Promise.resolve(false);
}

async function doCopy(m, toast) {
  let ok = false;
  try {
    ok = await copyText(m.text || "");
  } catch (err) {
    window.console.debug("community copy skipped", err);
  }
  toast(ok ? "Copied" : "Copy failed");
}

// ---------------- 1:1 Thread ----------------

export function Thread({
  chatId,
  onBack,
  onNav,
  threads,
  drafts,
  setDraft,
  push,
  patch,
  remove,
  reactTo,
  markRead,
  toast,
  forwardInto,
}) {
  const chat = CHATS.find((c) => c.id === chatId) || null;
  const person = chat ? personById(chat.person) : null;
  const messages = threads[chatId] || [];
  const [menuFor, setMenuFor] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [attach, setAttach] = useState(null);
  const [typing, setTyping] = useState(false);
  const [forwardMsg, setForwardMsg] = useState(null);
  const { playId, playPos, togglePlay } = usePlayback();
  const bodyRef = useRef(null);
  const replyTimer = useRef(null);
  const draft = drafts[chatId] || "";

  useEffect(
    () => () => {
      if (replyTimer.current) window.clearTimeout(replyTimer.current);
    },
    []
  );

  useEffect(() => {
    if (chat) markRead(chat.id);
  }, [chat, markRead]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, typing]);

  if (!chat || !person) return null;

  const onSendVoice = (dur) => {
    push(chat.id, { from: ME, kind: "voice", dur, peaks: makePeaks(`${chat.id}-${Date.now()}`, 30) });
    scheduleReply();
  };

  const scheduleReply = () => {
    if (replyTimer.current) return;
    setTyping(true);
    replyTimer.current = window.setTimeout(() => {
      push(chat.id, { from: person.id, kind: "text", text: replyFor(chat.id), time: stamp() });
      markRead(chat.id);
      setTyping(false);
      replyTimer.current = null;
    }, 1500);
  };

  const sendText = () => {
    const v = draft.trim();
    if (editing) {
      if (!v) return;
      patch(chat.id, editing.id, { text: v, edited: true });
      setEditing(null);
      setDraft(chat.id, "");
      return;
    }
    if (!v && !attach) return;
    if (attach && attach.kind === "photo") {
      push(chat.id, {
        from: ME,
        kind: "photo",
        text: v,
        replyTo: replyTo ? { from: replyTo.from, text: replyTo.text } : undefined,
      });
    } else if (attach) {
      push(chat.id, {
        from: ME,
        kind: "file",
        file: { name: attach.name, size: "2.4 MB", type: "PDF" },
        replyTo: replyTo ? { from: replyTo.from, text: replyTo.text } : undefined,
      });
    } else {
      push(chat.id, {
        from: ME,
        kind: "text",
        text: v,
        replyTo: replyTo ? { from: replyTo.from, text: replyTo.text } : undefined,
      });
    }
    setDraft(chat.id, "");
    setAttach(null);
    setReplyTo(null);
    scheduleReply();
  };

  const onAction = (kind, m) => {
    setMenuFor(null);
    if (kind === "copy") doCopy(m, toast);
    else if (kind === "reply") {
      setEditing(null);
      setReplyTo({ from: m.from, text: m.text });
    } else if (kind === "edit") {
      setReplyTo(null);
      setAttach(null);
      setEditing(m);
      setDraft(chat.id, m.text || "");
    } else if (kind === "forward") setForwardMsg(m);
    else if (kind === "report") {
      patch(chat.id, m.id, { reported: true });
      toast("Thanks — we'll take a look");
    } else if (kind === "delete") {
      remove(chat.id, m.id, m.from === ME);
      toast("Message deleted");
    }
  };

  const onQuickReact = (m, e) => {
    reactTo(chat.id, m.id, e);
    setMenuFor(null);
  };

  const doForward = (targetId) => {
    const src = forwardMsg;
    setForwardMsg(null);
    if (!src) return;
    forwardInto(src, targetId);
    toast("Forwarded");
    if (targetId !== chat.id) onNav(`chats/${targetId}`);
  };

  return (
    <>
      <Head
        title={person.name}
        sub={person.online ? "Online now" : "Away"}
        onBack={onBack}
        right={<Avatar person={person} size={38} dot />}
      />
      <div className="cm-body" ref={bodyRef}>
        <div className="cm-thread">
          <span className="cm-daysep">Today</span>
          {messages.length === 0 ? (
            <Empty icon={<ChatIcon />} title="No messages yet" sub={`Say hi to ${person.name.split(" ")[0]}.`} />
          ) : (
            messages.map((m) => (
              <MsgRow
                key={m.id}
                m={m}
                mine={m.from === ME}
                sender={m.from === ME ? null : person}
                showName={false}
                menuOpen={menuFor === m.id}
                onToggleMenu={() => setMenuFor((f) => (f === m.id ? null : m.id))}
                onAction={onAction}
                onQuickReact={onQuickReact}
                playing={playId === m.id}
                playPos={playId === m.id ? playPos : 0}
                onTogglePlay={togglePlay}
              />
            ))
          )}
          {typing ? (
            <div className="cm-msg theirs">
              <Avatar person={person} size={30} />
              <span className="cm-typing" role="status" aria-label={`${person.name} is typing`}>
                <i />
                <i />
                <i />
              </span>
            </div>
          ) : null}
        </div>
      </div>
      {menuFor ? <button type="button" className="cm-catch" aria-label="Close menu" onClick={() => setMenuFor(null)} /> : null}
      <div className="cm-foot">
        <Composer
          value={draft}
          onChange={(v) => setDraft(chat.id, v)}
          placeholder={`Message ${person.name.split(" ")[0]}…`}
          replyTo={replyTo}
          replyName={replyTo ? replyNameOf(replyTo.from) : ""}
          onCancelReply={() => setReplyTo(null)}
          editing={editing}
          onCancelEdit={() => {
            setEditing(null);
            setDraft(chat.id, "");
          }}
          attach={attach}
          onClearAttach={() => setAttach(null)}
          onPickAttach={(kind) =>
            setAttach(kind === "photo" ? { kind, name: "photo.jpg" } : { kind, name: "notes.pdf" })
          }
          onSend={sendText}
          onSendVoice={onSendVoice}
          canSend={editing ? draft.trim().length > 0 : draft.trim().length > 0 || !!attach}
        />
      </div>
      {forwardMsg ? (
        <Sheet title="Forward to" onClose={() => setForwardMsg(null)}>
          {CHATS.map((c) => {
            const p = personById(c.person);
            return (
              <button key={c.id} type="button" className="cm-sheetrow" onClick={() => doForward(c.id)}>
                <Avatar person={p} size={42} />
                <span className="cm-sheet-l">
                  <span className="cm-sheet-t">{p ? p.name : "Unknown"}</span>
                </span>
              </button>
            );
          })}
        </Sheet>
      ) : null}
    </>
  );
}

// ---------------- Global chat ----------------

export function GlobalChat({
  messages,
  onBack,
  pushGlobal,
  patchGlobal,
  removeGlobal,
  reactGlobal,
  toast,
  room,
}) {
  const [draft, setDraft] = useState("");
  const [menuFor, setMenuFor] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [attach, setAttach] = useState(null);
  const [typing, setTyping] = useState(null);
  const { playId, playPos, togglePlay } = usePlayback();
  const bodyRef = useRef(null);
  const replyRef = useRef(0);
  const timers = useRef([]);

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    []
  );

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, typing]);

  const sendText = () => {
    const v = draft.trim();
    if (editing) {
      if (!v) return;
      patchGlobal(editing.id, { text: v, edited: true });
      setEditing(null);
      setDraft("");
      return;
    }
    if (!v && !attach) return;
    if (attach && attach.kind === "photo") {
      pushGlobal({ from: ME, kind: "photo", text: v, replyTo: replyTo ? { from: replyTo.from, text: replyTo.text } : undefined });
    } else if (attach) {
      pushGlobal({
        from: ME,
        kind: "file",
        file: { name: attach.name, size: "2.4 MB", type: "PDF" },
        replyTo: replyTo ? { from: replyTo.from, text: replyTo.text } : undefined,
      });
    } else {
      pushGlobal({ from: ME, kind: "text", text: v, replyTo: replyTo ? { from: replyTo.from, text: replyTo.text } : undefined });
    }
    setDraft("");
    setAttach(null);
    setReplyTo(null);
    scheduleGlobalReply();
  };

  const onSendVoice = (dur) => {
    pushGlobal({ from: ME, kind: "voice", dur, peaks: makePeaks(`global-${Date.now()}`, 30) });
    scheduleGlobalReply();
  };

  const scheduleGlobalReply = () => {
    replyRef.current += 1;
    const r = GLOBAL_REPLIES[replyRef.current % GLOBAL_REPLIES.length];
    setTyping(r.from);
    const t = window.setTimeout(() => {
      pushGlobal({ from: r.from, kind: "text", text: r.text });
      setTyping(null);
    }, 1600);
    timers.current.push(t);
  };

  const onAction = (kind, m) => {
    setMenuFor(null);
    if (kind === "copy") doCopy(m, toast);
    else if (kind === "reply") {
      setEditing(null);
      setReplyTo({ from: m.from, text: m.text });
    } else if (kind === "edit") {
      setReplyTo(null);
      setAttach(null);
      setEditing(m);
      setDraft(m.text || "");
    } else if (kind === "forward") toast("Forwarding lives in 1:1 chats");
    else if (kind === "report") {
      patchGlobal(m.id, { reported: true });
      toast("Thanks — we'll take a look");
    } else if (kind === "delete") {
      removeGlobal(m.id, m.from === ME);
      toast("Message deleted");
    }
  };

  const onQuickReact = (m, e) => {
    reactGlobal(m.id, e);
    setMenuFor(null);
  };

  return (
    <>
      <Head
        title={room.name}
        sub={
          <span>
            <span className="live" /> {room.members} online
          </span>
        }
        onBack={onBack}
      />
      <div className="cm-body" ref={bodyRef}>
        <div className="cm-pin rise">
          <span className="cm-pin-ic">
            <FlagIcon />
          </span>
          <span className="cm-pin-b">
            <span className="cm-pin-k">Pinned</span>
            <p className="cm-pin-t">{room.pinned}</p>
          </span>
        </div>
        <div className="cm-thread">
          {messages.map((m) =>
            m.kind === "system" ? (
              <span key={m.id} className="cm-sysrow">
                {m.text}
              </span>
            ) : (
              <MsgRow
                key={m.id}
                m={m}
                mine={m.from === ME}
                sender={m.from === ME ? null : personById(m.from)}
                showName
                menuOpen={menuFor === m.id}
                onToggleMenu={() => setMenuFor((f) => (f === m.id ? null : m.id))}
                onAction={onAction}
                onQuickReact={onQuickReact}
                playing={playId === m.id}
                playPos={playId === m.id ? playPos : 0}
                onTogglePlay={togglePlay}
              />
            )
          )}
          {typing ? (
            <div className="cm-msg theirs">
              <Avatar person={personById(typing)} size={30} />
              <span className="cm-typing" role="status" aria-label="Someone is typing">
                <i />
                <i />
                <i />
              </span>
            </div>
          ) : null}
        </div>
      </div>
      {menuFor ? <button type="button" className="cm-catch" aria-label="Close menu" onClick={() => setMenuFor(null)} /> : null}
      <div className="cm-foot">
        <Composer
          value={draft}
          onChange={setDraft}
          placeholder={`Message ${room.name}…`}
          replyTo={replyTo}
          replyName={replyTo ? replyNameOf(replyTo.from) : ""}
          onCancelReply={() => setReplyTo(null)}
          editing={editing}
          onCancelEdit={() => {
            setEditing(null);
            setDraft("");
          }}
          attach={attach}
          onClearAttach={() => setAttach(null)}
          onPickAttach={(kind) =>
            setAttach(kind === "photo" ? { kind, name: "photo.jpg" } : { kind, name: "notes.pdf" })
          }
          onSend={sendText}
          onSendVoice={onSendVoice}
          canSend={editing ? draft.trim().length > 0 : draft.trim().length > 0 || !!attach}
        />
      </div>
    </>
  );
}
