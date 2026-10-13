// Working thread: streaming answers, live tool cards, subagent + diff
// viewers, branches, edit-and-resend, permission flow, stop / resume.

import { useEffect, useRef, useState } from "react";
import { AGENT_ALT, FULL_RESULT, RUN_DENIED, RUN_INTRO, RUN_OUTRO, stamp } from "./data.js";
import {
  BoltIcon,
  BranchIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  CopyIcon,
  EditIcon,
  FlagIcon,
  RetryIcon,
  ShareIcon,
  ShieldIcon,
} from "./icons.jsx";
import { Composer } from "./Composer.jsx";
import { AgEmpty, AgSheet } from "./bits.jsx";

const RM = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function inline(t) {
  const parts = String(t || "").split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.length > 2 && p.startsWith("`") && p.endsWith("`"))
      return (
        <code key={i} className="inline">
          {p.slice(1, -1)}
        </code>
      );
    if (p.length > 4 && p.startsWith("**") && p.endsWith("**")) return <b key={i}>{p.slice(2, -2)}</b>;
    return <span key={i}>{p}</span>;
  });
}

function rich(t) {
  const lines = String(t || "").split("\n");
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (trimmed === "---") return <span key={i} className="ag-hr" />;
    if (trimmed.startsWith("> "))
      return (
        <span key={i} className="ag-quote">
          {inline(trimmed.slice(2))}
        </span>
      );
    if (trimmed.startsWith("- "))
      return (
        <span key={i} className="ag-bullet">
          {inline(trimmed.slice(2))}
        </span>
      );
    return (
      <span key={i}>
        {inline(line)}
        {i < lines.length - 1 ? <br /> : null}
      </span>
    );
  });
}

function tint(body) {
  const parts = String(body || "").split(/("[^"]*"|'[^']*'|\b(?:if|await|return|const|function|import|from|for|while|new)\b)/g);
  return parts.map((p, i) => {
    if ((p.startsWith('"') && p.endsWith('"')) || (p.startsWith("'") && p.endsWith("'")))
      return (
        <span key={i} className="s">
          {p}
        </span>
      );
    if (/^(if|await|return|const|function|import|from|for|while|new)$/.test(p))
      return (
        <span key={i} className="k">
          {p}
        </span>
      );
    return <span key={i}>{p}</span>;
  });
}

async function copyText(s, toast) {
  let ok = false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(s);
      ok = true;
    }
  } catch (err) {
    window.console.debug("agent copy skipped", err);
  }
  toast(ok ? "Copied" : "Copy failed");
}

function LiveTimer() {
  const [tenths, setTenths] = useState(0);
  useEffect(() => {
    const iv = window.setInterval(() => setTenths((t) => t + 1), 100);
    return () => window.clearInterval(iv);
  }, []);
  return <span className="ag-tdur">{(tenths / 10).toFixed(1)}s</span>;
}

export function ThreadView({ sessionId, msgs, onPush, onPatch, draft, setDraft, toast, apiRef, offline, onQueue, initialScroll, onScrollSave }) {
  const [openTools, setOpenTools] = useState({});
  const [diffMode, setDiffMode] = useState({});
  const [codeOpen, setCodeOpen] = useState({});
  const [editing, setEditing] = useState(null);
  const [attach, setAttach] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [perm, setPerm] = useState(null);
  const [stuck, setStuck] = useState(true);
  const [fullOut, setFullOut] = useState(null);
  const [showTime, setShowTime] = useState({});
  const [ctxMsg, setCtxMsg] = useState(null);
  const bodyRef = useRef(null);
  const timers = useRef([]);
  const streamIv = useRef(null);
  const idRef = useRef(0);
  const busyRef = useRef(false);
  const msgsRef = useRef(msgs);
  msgsRef.current = msgs;

  const nid = (p) => {
    idRef.current += 1;
    return `${p}${Date.now().toString(36)}${idRef.current}`;
  };
  const later = (fn, ms) => {
    const t = window.setTimeout(fn, RM() ? 0 : ms);
    timers.current.push(t);
  };

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      if (streamIv.current) window.clearInterval(streamIv.current);
      if (onScrollSave && bodyRef.current) onScrollSave(bodyRef.current.scrollTop);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    const el = bodyRef.current;
    if (el && initialScroll) el.scrollTop = initialScroll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = bodyRef.current;
    if (el && stuck) el.scrollTop = el.scrollHeight;
  }, [msgs, stuck]);

  function startStream(msgId, from, full, done) {
    if (streamIv.current) window.clearInterval(streamIv.current);
    if (RM()) {
      onPatch(msgId, { text: full });
      done();
      return;
    }
    let i = from.length;
    streamIv.current = window.setInterval(() => {
      i += 3;
      if (i >= full.length) {
        window.clearInterval(streamIv.current);
        streamIv.current = null;
        onPatch(msgId, { text: full });
        done();
      } else {
        onPatch(msgId, { text: full.slice(0, i) });
      }
    }, 24);
  }

  function finishRun(msgId, full) {
    onPatch(msgId, {
      stage: "done",
      text: full,
      outro: RUN_OUTRO,
      context: { used: 21, of: 200 },
      stats: { tokens: "1.4k", time: "5.2s", cost: "$0.003" },
    });
    busyRef.current = false;
    setStreaming(false);
  }

  function runTools(msgId) {
    const tools = [
      { id: nid("t"), name: "read src/auth.js", status: "run", args: '{ path: "src/auth.js" }' },
      { id: nid("t"), name: "edit src/auth.js", status: "wait", args: '{ file: "src/auth.js" }' },
    ];
    onPatch(msgId, { stage: "working", tools, subagent: { name: "explore", why: "trace the auth flow" } });
    later(() => {
      onPatch(msgId, {
        tools: tools.map((t, i) =>
          i === 0
            ? { ...t, status: "done", dur: "0.4s", result: "42 lines · guard at 12" }
            : { ...t, status: "run" }
        ),
      });
    }, 900);
    later(() => {
      const doneTools = [
        { ...tools[0], status: "done", dur: "0.4s", result: "42 lines · guard at 12" },
        { ...tools[1], status: "done", dur: "0.6s", result: "1 hunk · +3 −1" },
      ];
      onPatch(msgId, { tools: doneTools, stage: "streaming", text: "", full: RUN_INTRO });
      startStream(msgId, "", RUN_INTRO, () => finishRun(msgId, RUN_INTRO));
    }, 1800);
  }

  function runReply(userMsg) {
    void userMsg;
    busyRef.current = true;
    const aid = nid("a");
    onPush({ id: aid, role: "agent", time: stamp(), stage: "thinking", text: "" });
    setStreaming(true);
    later(() => {
      onPatch(aid, { stage: "perm" });
      setPerm({ file: "src/auth.js", msgId: aid });
    }, 700);
  }

  function resolvePerm(mode, msgId) {
    setPerm(null);
    if (mode === "deny") {
      onPatch(msgId, {
        stage: "denied",
        text: RUN_DENIED,
        tools: [{ id: nid("t"), name: "edit src/auth.js", status: "denied", args: '{ file: "src/auth.js" }' }],
      });
      busyRef.current = false;
      setStreaming(false);
      return;
    }
    if (mode === "always") toast("Always allowed · this chat");
    runTools(msgId);
  }

  function stop() {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    if (streamIv.current) {
      window.clearInterval(streamIv.current);
      streamIv.current = null;
    }
    setPerm(null);
    busyRef.current = false;
    setStreaming(false);
    const cur = msgsRef.current.find((m) =>
      ["thinking", "perm", "working", "streaming"].includes(m.stage)
    );
    if (cur) onPatch(cur.id, { stage: "stopped" });
  }

  function resume(m) {
    if (!m.full) return;
    onPatch(m.id, { stage: "streaming" });
    setStreaming(true);
    startStream(m.id, m.text || "", m.full, () => finishRun(m.id, m.full));
  }

  function regenerate(m) {
    onPatch(m.id, {
      stage: "working",
      text: "",
      outro: undefined,
      stats: undefined,
      context: undefined,
      full: undefined,
    });
    setStreaming(true);
    runTools(m.id);
  }

  function lastAgent() {
    const list = msgsRef.current.filter((m) => m.role === "agent");
    return list.length > 0 ? list[list.length - 1] : null;
  }

  function transcript() {
    return msgsRef.current
      .map((m) => (m.role === "user" ? `You: ${m.text}` : `Codino: ${m.text || ""}${m.outro ? `\n${m.outro}` : ""}`))
      .join("\n\n");
  }

  useEffect(() => {
    if (apiRef) {
      apiRef.current = {
        regenerate: () => {
          const m = lastAgent();
          if (m && !streaming) regenerate(m);
        },
        copyThread: () => copyText(transcript(), toast),
        flush: () => {
          const list = msgsRef.current;
          const last = list.length > 0 ? list[list.length - 1] : null;
          if (last && last.role === "user" && !busyRef.current) runReply(last);
        },
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgs, streaming]);

  // Auto-run when mounted with a fresh user message (sent from root).
  useEffect(() => {
    const list = msgsRef.current;
    const last = list.length > 0 ? list[list.length - 1] : null;
    if (last && last.role === "user" && !last.queued && !busyRef.current) {
      runReply(last);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function send() {
    const v = draft.trim();
    if (editing) {
      if (!v) return;
      onPatch(editing, { text: v, edited: true });
      setEditing(null);
      setDraft("");
      toast("New branch started");
    } else {
      if (!v && !attach) return;
      setDraft("");
      setAttach(null);
    }
    const um = {
      id: nid("u"),
      role: "user",
      text: editing ? v : v || "Review this photo",
      time: stamp(),
      attach: !editing && attach ? { ...attach } : undefined,
      queued: offline || undefined,
    };
    onPush(um);
    if (offline) {
      if (onQueue) onQueue();
      toast("Queued · sends on reconnect");
      return;
    }
    runReply(um);
  }

  const onScroll = () => {
    const el = bodyRef.current;
    if (!el) return;
    setStuck(el.scrollHeight - el.scrollTop - el.clientHeight < 60);
  };
  const jumpLatest = () => {
    const el = bodyRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
      setStuck(true);
    }
  };

  function toolCard(m, t) {
    const open = !!openTools[t.id];
    const statCls = t.status === "done" ? "done" : t.status === "fail" || t.status === "denied" ? "fail" : "run";
    return (
      <div key={t.id} className={open ? "ag-tool open" : "ag-tool"}>
        <button
          type="button"
          className="ag-tool-head"
          aria-expanded={open}
          onClick={() => setOpenTools((p) => ({ ...p, [t.id]: !p[t.id] }))}
        >
          <span className={`ag-tstat ${statCls}`}>
            {t.status === "done" ? <CheckIcon /> : t.status === "run" || t.status === "wait" ? <span className="spin" /> : <CloseIcon />}
          </span>
          <span className="ag-tname">{t.name}</span>
          {t.status === "run" && !t.dur ? <LiveTimer /> : t.dur ? <span className="ag-tdur">{t.dur}</span> : null}
          <span className="chev">
            <ChevronDownIcon />
          </span>
        </button>
        {open ? (
          <div className="ag-tool-body">
            {t.cmd ? <p className="ag-cmdline">{t.name.replace(/^\$ /, "")}</p> : null}
            <p className="ag-arg">{t.args}</p>
            {t.result ? (
              <p className={t.status === "fail" || t.status === "denied" ? "ag-result fail" : "ag-result"}>
                <span className="ok">{t.status === "done" ? <CheckIcon /> : <CloseIcon />}</span>
                {t.status === "denied" ? "Denied by you" : t.result}
              </p>
            ) : t.status === "run" ? (
              <p className="ag-result">Running…</p>
            ) : null}
            {typeof t.exit === "number" ? (
              <span className={t.exit === 0 ? "ag-exit ok" : "ag-exit bad"}>exit {t.exit}</span>
            ) : null}
            <div className="ag-tool-links">
              <button type="button" className="ag-linkbtn" onClick={() => copyText(t.args || "", toast)}>
                Copy args
              </button>
              {t.result ? (
                <button type="button" className="ag-linkbtn" onClick={() => copyText(t.result || "", toast)}>
                  Copy result
                </button>
              ) : null}
              {t.result ? (
                <button type="button" className="ag-linkbtn" onClick={() => setFullOut(t)}>
                  Full output
                </button>
              ) : null}
              {t.cmd && typeof t.exit === "number" ? (
                <button type="button" className="ag-linkbtn" onClick={() => toast("Re-ran · passed")}>
                  Re-run
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  function diffView(m) {
    const d = m.diff;
    const mode = diffMode[m.id] || "unified";
    const lines = String(d.unified || "").split("\n");
    const dels = lines.filter((l) => l.startsWith("-")).join("\n");
    const adds = lines.filter((l) => l.startsWith("+")).join("\n");
    return (
      <div className="ag-diff">
        <div className="ag-diff-head">
          <span className="ag-diff-file">{d.file}</span>
          <span className="ag-count">
            <span className="p">+{d.plus}</span> <span className="m">−{d.minus}</span>
          </span>
          <span className="ag-diff-toggle" role="group" aria-label="Diff layout">
            <button type="button" className={mode === "unified" ? "on" : ""} onClick={() => setDiffMode((p) => ({ ...p, [m.id]: "unified" }))}>
              Uni
            </button>
            <button type="button" className={mode === "split" ? "on" : ""} onClick={() => setDiffMode((p) => ({ ...p, [m.id]: "split" }))}>
              Split
            </button>
          </span>
        </div>
        {mode === "unified" ? (
          <p className="ag-diff-pre">
            {lines.map((l, i) =>
              l.startsWith("-") ? (
                <span key={i} className="del">
                  {l}
                </span>
              ) : l.startsWith("+") ? (
                <span key={i} className="add">
                  {l}
                </span>
              ) : (
                <span key={i}>{l}</span>
              )
            )}
          </p>
        ) : (
          <div className="ag-diff-split">
            <div className="ag-diff-col del">{dels}</div>
            <div className="ag-diff-col add">{adds}</div>
          </div>
        )}
      </div>
    );
  }

  function codeView(m) {
    const open = !!codeOpen[m.id];
    return (
      <div className={open ? "ag-code open" : "ag-code"}>
        <div className="ag-code-head">
          <span className="ag-lang">{m.code.lang}</span>
          <button type="button" className="ag-codebtn" onClick={() => copyText(m.code.body, toast)} aria-label="Copy code">
            <CopyIcon />
          </button>
          <button
            type="button"
            className="ag-codebtn"
            onClick={() => setCodeOpen((p) => ({ ...p, [m.id]: !p[m.id] }))}
            aria-label={open ? "Collapse code" : "Expand code"}
            aria-expanded={open}
          >
            {open ? "Less" : "More"}
          </button>
        </div>
        <p className="ag-pre">{tint(m.code.body)}</p>
      </div>
    );
  }

  function agentMsg(m) {
    const alt = m.branches && m.branch === 1;
    const doneTools = (m.tools || []).filter((t) => t.status === "done").length;
    return (
      <div className="ag-abody" key={m.id}>
        {["thinking", "perm"].includes(m.stage) ? (
          <span className="ag-think" role="status" aria-label="Working">
            <i />
            <i />
            <i />
          </span>
        ) : null}
        {m.subagent ? (
          <div className="ag-sub">
            <span className="ag-sub-ic">
              <BranchIcon />
            </span>
            <span className="ag-sub-b">
              <span className="ag-sub-k">Subagent · {m.subagent.name}</span>
              <span className="ag-sub-t">{m.subagent.why}</span>
            </span>
          </div>
        ) : null}
        {m.skills || m.hooks ? (
          <div className="ag-tagrow">
            {(m.skills || []).map((s) => (
              <span key={s} className="ag-tag skill">
                skill:{s}
              </span>
            ))}
            {(m.hooks || []).map((h) => (
              <span key={h} className="ag-tag hook">
                hook:{h}
              </span>
            ))}
          </div>
        ) : null}
        {(m.tools || []).length > 1 && doneTools === (m.tools || []).length && m.groupDur ? (
          <p className="ag-toolgroup">
            Ran {m.tools.length} tools · {m.groupDur}
          </p>
        ) : null}
        {(m.tools || []).map((t) => toolCard(m, t))}
        {alt ? (
          <p className="ag-text">{AGENT_ALT}</p>
        ) : (
          <>
            {m.text ? (
              <div className="ag-text">
                {rich(m.text)}
                {m.stage === "streaming" ? <span className="ag-caret" aria-hidden="true" /> : null}
              </div>
            ) : null}
            {m.code ? codeView(m) : null}
            {m.outro ? <div className="ag-text">{rich(m.outro)}</div> : null}
            {m.diff ? diffView(m) : null}
            {m.link ? (
              <button
                type="button"
                className="ag-linkcard"
                onClick={() => toast("Opened in browser")}
                onContextMenu={(e) => {
                  e.preventDefault();
                  copyText(m.link.url, toast);
                }}
                aria-label={`${m.link.title} · ${m.link.site}`}
              >
                <span className="fav" aria-hidden="true">
                  {m.link.site.charAt(0).toUpperCase()}
                </span>
                <span>
                  <b>{m.link.title}</b>
                  <span>{m.link.site}</span>
                </span>
              </button>
            ) : null}
          </>
        )}
        {m.context ? (
          <div className="ag-ctx">
            <span className="ag-ctx-track">
              <i style={{ width: `${Math.round((m.context.used / m.context.of) * 100)}%` }} />
            </span>
            <span className="ag-ctx-n">
              {m.context.used}k / {m.context.of}k
            </span>
          </div>
        ) : null}
        {m.stats ? (
          <p className="ag-stats" role="status">
            {m.stats.tokens} · {m.stats.time} · {m.stats.cost}
          </p>
        ) : null}
        {m.stage === "stopped" ? (
          <div className="ag-branches" role="group" aria-label="Stopped options">
            {m.full ? (
              <button type="button" className="ag-chip" onClick={() => resume(m)}>
                Resume
              </button>
            ) : null}
            <button type="button" className="ag-chip" onClick={() => regenerate(m)}>
              Regenerate
            </button>
          </div>
        ) : null}
        {m.stage === "done" ? (
          <div className="ag-acts">
            <button type="button" className="ag-mini" onClick={() => copyText(`${m.text || ""}${m.outro ? `\n${m.outro}` : ""}`, toast)} aria-label="Copy answer">
              <CopyIcon />
            </button>
            <button type="button" className="ag-mini" onClick={() => regenerate(m)} aria-label="Regenerate answer">
              <RetryIcon />
            </button>
            {m.branches ? (
              <span className="ag-branches" role="group" aria-label="Answer branches">
                <button
                  type="button"
                  onClick={() => onPatch(m.id, { branch: 0 })}
                  aria-label="Previous branch"
                >
                  <ChevronLeftIcon />
                </button>
                <span>
                  {(m.branch || 0) + 1} / {m.branches.length}
                </span>
                <button type="button" onClick={() => onPatch(m.id, { branch: 1 })} aria-label="Next branch">
                  <ChevronRightIcon />
                </button>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  const topCtx = (() => {
    for (let i = msgs.length - 1; i >= 0; i -= 1) {
      const c = msgs[i].context;
      if (c) {
        const pct = Math.min(100, Math.round((c.used / c.of) * 100));
        return { pct, cls: pct >= 80 ? "ag-ctxbar-top hot" : pct >= 50 ? "ag-ctxbar-top warn" : "ag-ctxbar-top" };
      }
    }
    return null;
  })();

  return (
    <>
      {topCtx ? (
        <div className={topCtx.cls} role="status" aria-label="Context usage">
          <i style={{ width: `${topCtx.pct}%` }} />
        </div>
      ) : null}
      <div className="ag-body" ref={bodyRef} onScroll={onScroll}>
        <div className="ag-thread">
          {msgs.length === 0 ? (
            <AgEmpty icon={<BoltIcon size={30} />} title="New chat" sub="Ask anything to begin." />
          ) : (
            msgs.map((m) =>
              m.kind === "compact" ? (
                <span key={m.id} className="ag-compact">
                  {m.text}
                </span>
              ) : m.role === "user" ? (
                <div key={m.id} className={m.queued ? "ag-msg-queued" : undefined}>
                  <div className="ag-urow">
                    <p
                      className="ag-ububble"
                      onClick={() => setShowTime((p) => ({ ...p, [m.id]: !p[m.id] }))}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setCtxMsg(m);
                      }}
                    >
                      {m.attach ? (
                        <>
                          Attached: {m.attach.name}
                          {"\n"}
                        </>
                      ) : (
                        ""
                      )}
                      {m.text}
                      {m.edited ? " · edited" : null}
                      {m.queued ? <span className="ag-qtag">queued</span> : null}
                    </p>
                  </div>
                  {showTime[m.id] ? <p className="ag-mtime" style={{ textAlign: "right" }}>{m.time}</p> : null}
                  <div className="ag-acts" style={{ justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="ag-mini"
                      onClick={() => {
                        setEditing(m.id);
                        setDraft(m.text || "");
                      }}
                      aria-label="Edit and resend"
                    >
                      <EditIcon />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={m.id}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setCtxMsg(m);
                  }}
                >
                  {agentMsg(m)}
                  {showTime[m.id] ? <p className="ag-mtime">{m.time}</p> : null}
                </div>
              )
            )
          )}
        </div>
      </div>
      {!stuck ? (
        <button type="button" className="ag-fab" onClick={jumpLatest} aria-label="Jump to latest">
          <ChevronDownIcon />
        </button>
      ) : null}
      <div className="ag-foot">
        <Composer
          value={draft}
          onChange={(v) => setDraft(v)}
          placeholder="Ask Codino…"
          streaming={streaming}
          onStop={stop}
          onSend={send}
          canSend={editing ? draft.trim().length > 0 : draft.trim().length > 0 || !!attach}
          attach={attach}
          onClearAttach={() => setAttach(null)}
          onPickAttach={setAttach}
          replyCtx={editing ? { k: "Editing", t: "Resend creates a branch" } : null}
          onCancelCtx={() => {
            setEditing(null);
            setDraft("");
          }}
        />
      </div>
      {perm ? (
        <AgSheet title="Permission" onClose={() => resolvePerm("deny", perm.msgId)}>
          <div className="ag-perm-file">
            <span className="ic">
              <ShieldIcon />
            </span>
            <span>
              <b>{perm.file}</b>
              <span>Codino wants to edit this file</span>
            </span>
          </div>
          <div className="ag-perm-btns">
            <button type="button" className="ag-btn primary full" onClick={() => resolvePerm("once", perm.msgId)}>
              Approve once
            </button>
            <button type="button" className="ag-btn green full" onClick={() => resolvePerm("always", perm.msgId)}>
              Always allow
            </button>
            <button type="button" className="ag-btn danger full" onClick={() => resolvePerm("deny", perm.msgId)}>
              Deny
            </button>
          </div>
        </AgSheet>
      ) : null}
      {fullOut ? (
        <AgSheet title={fullOut.name} onClose={() => setFullOut(null)}>
          <p className="ag-arg" style={{ whiteSpace: "pre-wrap" }}>
            {FULL_RESULT}
          </p>
        </AgSheet>
      ) : null}
      {ctxMsg ? (
        <AgSheet title="Message" onClose={() => setCtxMsg(null)}>
          <button
            type="button"
            className="ag-sheetrow"
            onClick={() => {
              const m = ctxMsg;
              setCtxMsg(null);
              copyText(m.text || "", toast);
            }}
          >
            <span className="ag-sheet-ic">
              <CopyIcon />
            </span>
            <span className="ag-sheet-l">
              <span className="ag-sheet-t">Copy</span>
            </span>
          </button>
          <button
            type="button"
            className="ag-sheetrow"
            onClick={() => {
              setCtxMsg(null);
              toast("Shared");
            }}
          >
            <span className="ag-sheet-ic">
              <ShareIcon />
            </span>
            <span className="ag-sheet-l">
              <span className="ag-sheet-t">Share</span>
            </span>
          </button>
          {ctxMsg.role === "agent" ? (
            <button
              type="button"
              className="ag-sheetrow"
              onClick={() => {
                setCtxMsg(null);
                toast("Reported");
              }}
            >
              <span className="ag-sheet-ic">
                <FlagIcon />
              </span>
              <span className="ag-sheet-l">
                <span className="ag-sheet-t">Report</span>
              </span>
            </button>
          ) : null}
        </AgSheet>
      ) : null}
    </>
  );
}
