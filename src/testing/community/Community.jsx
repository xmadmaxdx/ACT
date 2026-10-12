// Community root: the multi-page demo shell. Owns every shared store — threads,
// drafts, global messages, unread, feed, follows — and maps the testing-ground
// sub-route to pages. Chat threads stay mounted per id so each keeps its own
// independent state while you move between pages.

import { useCallback, useMemo, useRef, useState } from "react";
import "./community.css";
import {
  CHATS,
  FEED_INCOMING,
  FEED_SEED,
  GLOBAL_ROOM,
  GLOBAL_SEED,
  ME,
  SEED_MESSAGES,
  chatById,
  makePeaks,
  personById,
  stamp,
} from "./data.js";import { ChatIcon } from "./icons.jsx";
import { Badges, Feed, People, Profile } from "./FeedPages.jsx";
import { Chats, GlobalChat, Thread } from "./ChatPages.jsx";
import { Empty, Head } from "./ui.jsx";

function cloneThreads() {
  const out = {};
  for (const id of Object.keys(SEED_MESSAGES)) {
    out[id] = SEED_MESSAGES[id].map((m) => ({
      ...m,
      peaks: m.kind === "voice" && !m.peaks ? makePeaks(m.id, 30) : m.peaks,
      reactions: (m.reactions || []).map((r) => ({ ...r, by: [...r.by] })),
      replyTo: m.replyTo ? { ...m.replyTo } : undefined,
      file: m.file ? { ...m.file } : undefined,
    }));
  }
  return out;
}

export default function Community({ sub, onNav }) {
  const [threads, setThreads] = useState(cloneThreads);
  const [drafts, setDrafts] = useState({});
  const [globalMsgs, setGlobalMsgs] = useState(() =>
    GLOBAL_SEED.map((m) => ({
      ...m,
      peaks: m.kind === "voice" && !m.peaks ? makePeaks(m.id, 30) : m.peaks,
      reactions: (m.reactions || []).map((r) => ({ ...r, by: [...r.by] })),
      replyTo: m.replyTo ? { ...m.replyTo } : undefined,
    }))
  );
  const [unread, setUnread] = useState(() => {
    const u = {};
    for (const c of CHATS) u[c.id] = c.unread || 0;
    return u;
  });
  const [activities, setActivities] = useState(FEED_SEED);
  const [incomingIdx, setIncomingIdx] = useState(0);
  const [following, setFollowing] = useState({});
  const [toastMsg, setToastMsg] = useState(null);
  const toastTimer = useRef(null);
  const idRef = useRef(0);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 1800);
  }, []);

  const setDraft = useCallback((chatId, v) => {
    setDrafts((prev) => ({ ...prev, [chatId]: v }));
  }, []);

  const push = useCallback((chatId, partial) => {
    idRef.current += 1;
    const msg = {
      id: `u${Date.now().toString(36)}${idRef.current}`,
      time: stamp(),
      ...partial,
    };
    if (msg.kind === "voice" && !msg.peaks) msg.peaks = makePeaks(msg.id, 30);
    if (msg.from === ME && !msg.status) msg.status = "sent";
    setThreads((prev) => ({ ...prev, [chatId]: [...(prev[chatId] || []), msg] }));
  }, []);

  const patch = useCallback((chatId, id, p) => {
    setThreads((prev) => ({
      ...prev,
      [chatId]: (prev[chatId] || []).map((m) => (m.id === id ? { ...m, ...p } : m)),
    }));
  }, []);

  const remove = useCallback((chatId, id, mine) => {
    setThreads((prev) => ({
      ...prev,
      [chatId]: mine
        ? (prev[chatId] || []).filter((m) => m.id !== id)
        : (prev[chatId] || []).map((m) =>
            m.id === id ? { ...m, deleted: true, text: "", reactions: [] } : m
          ),
    }));
  }, []);

  const reactTo = useCallback((chatId, id, emoji) => {
    setThreads((prev) => ({
      ...prev,
      [chatId]: (prev[chatId] || []).map((m) => {
        if (m.id !== id) return m;
        const cur = m.reactions || [];
        const i = cur.findIndex((r) => r.emoji === emoji);
        if (i === -1) return { ...m, reactions: [...cur, { emoji, by: [ME] }] };
        const by = cur[i].by.includes(ME) ? cur[i].by.filter((b) => b !== ME) : [...cur[i].by, ME];
        const next =
          by.length === 0
            ? cur.filter((_, j) => j !== i)
            : cur.map((r, j) => (j === i ? { ...r, by } : r));
        return { ...m, reactions: next };
      }),
    }));
  }, []);

  const markRead = useCallback((chatId) => {
    setUnread((prev) => (prev[chatId] ? { ...prev, [chatId]: 0 } : prev));
    setThreads((prev) => ({
      ...prev,
      [chatId]: (prev[chatId] || []).map((m) =>
        m.from === ME && m.status !== "read" ? { ...m, status: "read" } : m
      ),
    }));
  }, []);

  const pushGlobal = useCallback((partial) => {
    idRef.current += 1;
    const msg = {
      id: `g${Date.now().toString(36)}${idRef.current}`,
      time: stamp(),
      ...partial,
    };
    if (msg.kind === "voice" && !msg.peaks) msg.peaks = makePeaks(msg.id, 30);
    setGlobalMsgs((prev) => [...prev, msg]);
  }, []);

  const patchGlobal = useCallback((id, p) => {
    setGlobalMsgs((prev) => prev.map((m) => (m.id === id ? { ...m, ...p } : m)));
  }, []);

  const removeGlobal = useCallback((id, mine) => {
    setGlobalMsgs((prev) =>
      mine
        ? prev.filter((m) => m.id !== id)
        : prev.map((m) => (m.id === id ? { ...m, deleted: true, text: "", reactions: [] } : m))
    );
  }, []);

  const reactGlobal = useCallback((id, emoji) => {
    setGlobalMsgs((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const cur = m.reactions || [];
        const i = cur.findIndex((r) => r.emoji === emoji);
        if (i === -1) return { ...m, reactions: [...cur, { emoji, by: [ME] }] };
        const by = cur[i].by.includes(ME) ? cur[i].by.filter((b) => b !== ME) : [...cur[i].by, ME];
        const next =
          by.length === 0
            ? cur.filter((_, j) => j !== i)
            : cur.map((r, j) => (j === i ? { ...r, by } : r));
        return { ...m, reactions: next };
      })
    );
  }, []);

  const forwardInto = useCallback(
    (src, targetId) => {
      const { id: _id, time: _time, status: _status, reactions: _reactions, reported: _reported, ...rest } = src;
      push(targetId, { ...rest, reactions: [], from: ME });
    },
    [push]
  );

  const toggleFollow = useCallback((personId) => {
    setFollowing((prev) => {
      const next = { ...prev };
      if (next[personId]) delete next[personId];
      else next[personId] = true;
      return next;
    });
  }, []);

  const refreshFeed = useCallback(() => {
    setIncomingIdx((i) => {
      if (i >= FEED_INCOMING.length) return i;
      setActivities((prev) => [FEED_INCOMING[i], ...prev]);
      return i + 1;
    });
  }, []);

  const messagePerson = useCallback(
    (personId) => {
      const found = CHATS.find((c) => c.person === personId) || null;
      if (found) onNav(`chats/${found.id}`);
      else toast("No chat yet — say hi in Global");
    },
    [onNav, toast]
  );

  const unreadTotal = useMemo(() => Object.values(unread).reduce((a, b) => a + (b || 0), 0), [unread]);
  const me = personById(ME);

  const segs = String(sub || "feed").split("/");
  const head = segs[0] || "feed";

  let page = null;
  if (head === "feed" || head === "") {
    page = (
      <Feed
        activities={activities}
        unreadTotal={unreadTotal}
        memberCount={GLOBAL_ROOM.members}
        myStreak={me ? me.streak : 0}
        onNav={onNav}
        onRefresh={refreshFeed}
        canRefresh={incomingIdx < FEED_INCOMING.length}
      />
    );
  } else if (head === "chats" && !segs[1]) {
    page = <Chats unread={unread} threads={threads} onBack={() => onNav("feed")} onNav={onNav} />;
  } else if (head === "chats" && segs[1]) {
    const found = chatById(segs[1]);
    page = found ? (
      <Thread
        key={found.id}
        chatId={found.id}
        onBack={() => onNav("chats")}
        onNav={onNav}
        threads={threads}
        drafts={drafts}
        setDraft={setDraft}
        push={push}
        patch={patch}
        remove={remove}
        reactTo={reactTo}
        markRead={markRead}
        toast={toast}
        forwardInto={forwardInto}
      />
    ) : (
      <NotFound title="Chat not found" onBack={() => onNav("chats")} action={() => onNav("chats")} actionLabel="Back to chats" />
    );
  } else if (head === "global") {
    page = (
      <GlobalChat
        messages={globalMsgs}
        onBack={() => onNav("feed")}
        pushGlobal={pushGlobal}
        patchGlobal={patchGlobal}
        removeGlobal={removeGlobal}
        reactGlobal={reactGlobal}
        toast={toast}
        room={GLOBAL_ROOM}
      />
    );
  } else if (head === "badges") {
    page = <Badges onBack={() => onNav("feed")} onNav={onNav} />;
  } else if (head === "people") {
    page = <People following={following} onToggleFollow={toggleFollow} onBack={() => onNav("feed")} onNav={onNav} />;
  } else if (head === "person" && segs[1]) {
    const found = personById(segs[1]);
    page = found ? (
      <Profile
        personId={found.id}
        onBack={() => onNav("feed")}
        onNav={onNav}
        onMessage={messagePerson}
        following={following}
        onToggleFollow={toggleFollow}
      />
    ) : (
      <NotFound title="Member not found" onBack={() => onNav("people")} action={() => onNav("people")} actionLabel="Back to people" />
    );
  } else {
    page = (
      <NotFound title="Nothing here" onBack={() => onNav("feed")} action={() => onNav("feed")} actionLabel="Back to feed" />
    );
  }

  return (
    <div className="cm-app">
      {page}
      {toastMsg ? (
        <p className="cm-toast" role="status">
          {toastMsg}
        </p>
      ) : null}
    </div>
  );
}

function NotFound({ title, onBack, action, actionLabel }) {
  return (
    <>
      <Head title={title} onBack={onBack} />
      <div className="cm-body plain">
        <Empty icon={<ChatIcon />} title={title} sub="This link points nowhere." actionLabel={actionLabel} onAction={action} />
      </div>
    </>
  );
}
