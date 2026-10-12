// Community content pages: Feed, Profile, People, Badges.
// No tab nav bar anywhere on purpose: every move is made through page content
// (hub cards, activity cards, profile buttons) or the header back button.

import { useMemo, useState } from "react";
import { BADGES, PEOPLE, badgeById, personById } from "./data.js";
import {
  Avatar,
  BadgeGlyph,
  BookIcon,
  ChatIcon,
  CheckIcon,
  ChevronIcon,
  FlameIcon,
  GlobeIcon,
  PeopleIcon,
  SearchIcon,
} from "./icons.jsx";
import { BrandHead, Empty, Head, Seg, Sheet } from "./ui.jsx";

const CONFETTI = [
  { top: 5, left: 8, bg: "#ffe45e", delay: "0s" },
  { top: 9, left: 40, bg: "#ce82ff", delay: ".35s" },
  { top: 40, left: 6, bg: "#58cc02", delay: ".2s" },
  { top: 44, left: 43, bg: "#1cb0f6", delay: ".5s" },
];

function LessonArt({ frac }) {
  const r = 23;
  const c = 2 * Math.PI * r;
  const perfect = frac >= 1;
  return (
    <span className="cm-art lesson">
      <svg className="cm-ring" viewBox="0 0 56 56" aria-hidden="true">
        <circle className="track" cx="28" cy="28" r={r} />
        <circle
          className="arc"
          cx="28"
          cy="28"
          r={r}
          strokeDasharray={c}
          style={{ "--circ": c, "--to": c * (1 - Math.min(1, Math.max(0, frac))) }}
        />
      </svg>
      <BookIcon size={22} />
      {perfect
        ? CONFETTI.map((d, i) => (
            <i key={i} className="cm-confetti" style={{ top: d.top, left: d.left, background: d.bg, animationDelay: d.delay }} />
          ))
        : null}
    </span>
  );
}

function StreakArt() {
  return (
    <span className="cm-art streak">
      <span className="flame">
        <FlameIcon size={30} />
      </span>
    </span>
  );
}

function BadgeArt({ badgeId }) {
  const b = badgeById(badgeId);
  return (
    <span className="cm-art badge">
      <BadgeGlyph name={b ? b.glyph : "spark"} size={27} />
    </span>
  );
}

const KIND_PILL = { lesson: "Lesson", streak: "Streak", badge: "Badge" };

function ActivityCard({ a, delay, onOpen }) {
  const p = personById(a.person);
  if (!p) return null;
  const frac = a.kind === "lesson" ? (a.correct || 0) / Math.max(1, a.total || 1) : 0;
  const b = a.kind === "badge" ? badgeById(a.badge) : null;
  return (
    <button type="button" className={`cm-acard rise d${delay}`} onClick={onOpen}>
      {a.kind === "lesson" ? <LessonArt frac={frac} /> : a.kind === "streak" ? <StreakArt /> : <BadgeArt badgeId={a.badge} />}
      <span className="cm-a-body">
        <span className="cm-a-head">
          <span className="cm-a-name">{p.name}</span>
          <span className="cm-a-ago">{a.ago}</span>
        </span>
        <span className="cm-a-text">
          {a.kind === "lesson" ? (
            <>
              Finished <b>{a.lesson}</b>
            </>
          ) : a.kind === "streak" ? (
            <>
              Hit a <b>{a.days}-day streak</b>
            </>
          ) : (
            <>
              Earned <b>{b ? b.title : "a badge"}</b>
            </>
          )}
        </span>
        <span className="cm-a-meta">
          <span className={`cm-pill ${a.kind}`}>{KIND_PILL[a.kind]}</span>
          {a.kind === "lesson" ? (
            <span className="cm-a-score">
              <CheckIcon /> {a.correct} / {a.total}
            </span>
          ) : null}
          <span className="cm-a-go">
            View <ChevronIcon />
          </span>
        </span>
      </span>
    </button>
  );
}

// ---------------- Feed ----------------

const FEED_FILTERS = [
  { id: "all", label: "All" },
  { id: "lesson", label: "Lessons" },
  { id: "streak", label: "Streaks" },
  { id: "badge", label: "Badges" },
];

const EMPTY_COPY = {
  lesson: { t: "No lessons yet", s: "Completions land here the moment they happen." },
  streak: { t: "No streaks here", s: "Come back after the next daily goal." },
  badge: { t: "No badges here", s: "New medals appear here automatically." },
};

export function Feed({ activities, unreadTotal, memberCount, myStreak, onNav, onRefresh, canRefresh }) {
  const [filter, setFilter] = useState("all");
  const list = filter === "all" ? activities : activities.filter((a) => a.kind === filter);
  const empty = EMPTY_COPY[filter];
  return (
    <>
      <BrandHead
        right={
          <span className="cm-me-chip" title="Your streak">
            <span className="flame">
              <FlameIcon size={15} />
            </span>
            {myStreak}
          </span>
        }
      />
      <div className="cm-body">
        <div className="cm-hero rise d1">
          <span className="cm-hero-ic">
            <FlameIcon size={24} />
          </span>
          <span className="cm-hero-b">
            <p className="cm-hero-t">{myStreak}-day streak</p>
            <p className="cm-hero-s">2 minutes today keeps it alive.</p>
          </span>
        </div>

        <div className="cm-hub">
          <button type="button" className="cm-hub-card rise d2" onClick={() => onNav("chats")}>
            <span className="cm-hub-ic b">
              <ChatIcon />
            </span>
            <span className="cm-hub-t">Chats</span>
            <span className="cm-hub-s">{unreadTotal > 0 ? `${unreadTotal} unread` : "Caught up"}</span>
            {unreadTotal > 0 ? <span className="cm-hub-pill">{unreadTotal}</span> : null}
          </button>
          <button type="button" className="cm-hub-card rise d2" onClick={() => onNav("global")}>
            <span className="cm-hub-ic g">
              <GlobeIcon />
            </span>
            <span className="cm-hub-t">Global</span>
            <span className="cm-hub-s">{memberCount} online</span>
          </button>
          <button type="button" className="cm-hub-card rise d3" onClick={() => onNav("people")}>
            <span className="cm-hub-ic p">
              <PeopleIcon />
            </span>
            <span className="cm-hub-t">People</span>
            <span className="cm-hub-s">Find learners</span>
          </button>
          <button type="button" className="cm-hub-card rise d3" onClick={() => onNav("badges")}>
            <span className="cm-hub-ic a">
              <BadgeGlyph name="trophy" size={21} />
            </span>
            <span className="cm-hub-t">Badges</span>
            <span className="cm-hub-s">Your album</span>
          </button>
        </div>

        <button type="button" className="cm-refresh rise d4" onClick={onRefresh} disabled={!canRefresh}>
          {canRefresh ? "↓  New activity" : "That's everything for now"}
        </button>

        <Seg options={FEED_FILTERS} value={filter} onChange={setFilter} label="Filter activity" />

        {list.length === 0 && empty ? (
          <Empty icon={<BookIcon size={30} />} title={empty.t} sub={empty.s} />
        ) : (
          <div className="cm-cards">
            {list.map((a, i) => (
              <ActivityCard
                key={a.id}
                a={a}
                delay={Math.min((i % 4) + 1, 4)}
                onOpen={() => onNav(`person/${a.person}`)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ---------------- Profile ----------------

const WEEK_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

export function Profile({ personId, onBack, onNav, onMessage, following, onToggleFollow }) {
  const person = personById(personId);
  if (!person) return null;
  const mine = person.id === "me";
  const days = useMemo(() => {
    const out = [];
    const today = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      out.push(d.getDate());
    }
    return out;
  }, []);
  const missed = (person.streak >> 3) % 7;
  const earned = BADGES.filter((b) => b.earned);
  return (
    <>
      <Head title={person.name} sub={person.handle} onBack={onBack} />
      <div className="cm-body">
        <div className="cm-prof">
          <div className="cm-prof-top rise">
            <Avatar person={person} size={76} />
            <p className="cm-prof-name">{person.name}</p>
            <p className="cm-prof-handle">{person.handle}</p>
            <span className={person.online ? "cm-prof-status" : "cm-prof-status away"}>
              {person.online ? "Online now" : "Away"}
            </span>
          </div>

          <div className="cm-prof-acts rise d1">
            {mine ? (
              <button type="button" className="cm-btn ghost full" onClick={() => onNav("chats")}>
                <ChatIcon /> Open chats
              </button>
            ) : (
              <>
                <button type="button" className="cm-btn primary full" onClick={() => onMessage(person.id)}>
                  <ChatIcon /> Message
                </button>
                <button
                  type="button"
                  className={following[person.id] ? "cm-btn ghost full" : "cm-btn green full"}
                  onClick={() => onToggleFollow(person.id)}
                  aria-pressed={!!following[person.id]}
                >
                  {following[person.id] ? "Following" : "Follow"}
                </button>
              </>
            )}
          </div>

          <div className="cm-stat-grid rise d2">
            <div className="cm-stat">
              <b>{person.streak}</b>
              <span>Streak</span>
            </div>
            <div className="cm-stat">
              <b>{person.lessons}</b>
              <span>Lessons</span>
            </div>
            <div className="cm-stat">
              <b>{person.xp >= 1000 ? `${(person.xp / 1000).toFixed(1)}k` : person.xp}</b>
              <span>XP</span>
            </div>
          </div>

          <div className="cm-panel rise d3">
            <p className="cm-panel-t">This week</p>
            <div className="cm-week">
              {days.map((n, i) => (
                <span key={i} className={i === missed ? "cm-day" : "cm-day on"}>
                  {WEEK_LETTERS[i]}
                  <b>{n}</b>
                </span>
              ))}
            </div>
          </div>

          <div className="cm-panel rise d4">
            <p className="cm-panel-t">Badges · {earned.length}</p>
            <div className="cm-shelf">
              {earned.slice(0, 4).map((b) => (
                <button key={b.id} type="button" className="cm-badge-mini" onClick={() => onNav("badges")}>
                  <span className="gl" style={{ background: b.tint, color: b.color }}>
                    <BadgeGlyph name={b.glyph} size={22} />
                  </span>
                  <span>{b.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------- People ----------------

export function People({ following, onToggleFollow, onBack, onNav }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const rows = PEOPLE.filter((p) => p.id !== "me").filter((p) =>
    needle.length === 0
      ? true
      : p.name.toLowerCase().includes(needle) || p.handle.toLowerCase().includes(needle)
  );
  return (
    <>
      <Head title="People" sub={`${rows.length} learners`} onBack={onBack} />
      <div className="cm-body plain">
        <div className="cm-search rise">
          <span className="ic">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or handle"
            aria-label="Search people"
            maxLength={40}
          />
        </div>
        {rows.length === 0 ? (
          <Empty
            icon={<SearchIcon />}
            title="Nobody found"
            sub={`Nothing matches “${q.trim()}”.`}
            actionLabel="Clear search"
            onAction={() => setQ("")}
          />
        ) : (
          <div className="cm-list">
            {rows.map((p, i) => (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                className={`cm-row rise d${Math.min((i % 4) + 1, 4)}`}
                aria-label={`Open ${p.name}`}
                onClick={() => onNav(`person/${p.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onNav(`person/${p.id}`);
                  }
                }}
              >
                <Avatar person={p} size={46} dot />
                <span className="cm-row-b">
                  <span className="cm-row-t">
                    <span className="cm-row-name">{p.name}</span>
                  </span>
                  <span className="cm-row-sub">
                    {p.streak}d streak · {p.lessons} lessons
                  </span>
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  className={following[p.id] ? "cm-follow on" : "cm-follow"}
                  aria-pressed={!!following[p.id]}
                  aria-label={following[p.id] ? `Unfollow ${p.name}` : `Follow ${p.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFollow(p.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleFollow(p.id);
                    }
                  }}
                >
                  {following[p.id] ? "On" : "Follow"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ---------------- Badges ----------------

const BADGE_TABS = [
  { id: "earned", label: "Earned" },
  { id: "locked", label: "Locked" },
];

export function Badges({ onBack, onNav }) {
  const [tab, setTab] = useState("earned");
  const [openId, setOpenId] = useState(null);
  const earned = BADGES.filter((b) => b.earned);
  const locked = BADGES.filter((b) => !b.earned);
  const open = openId ? BADGES.find((b) => b.id === openId) || null : null;
  const shown = tab === "earned" ? earned : locked;
  return (
    <>
      <Head title="Badges" sub={`${earned.length} of ${BADGES.length} earned`} onBack={onBack} />
      <div className="cm-body plain">
        <Seg options={BADGE_TABS} value={tab} onChange={setTab} label="Badge state" />
        <div className="cm-bgrid">
          {shown.map((b, i) => (
            <button
              key={b.id}
              type="button"
              className={b.earned ? `cm-bcard rise d${Math.min((i % 4) + 1, 4)}` : `cm-bcard locked rise d${Math.min((i % 4) + 1, 4)}`}
              onClick={() => setOpenId(b.id)}
            >
              <span className="cm-bglyph" style={{ background: b.tint, color: b.color }}>
                <BadgeGlyph name={b.glyph} size={26} />
              </span>
              <span className="cm-bt">{b.title}</span>
              {b.earned ? <span className="cm-bwhen">Got {b.earnedOn}</span> : <span className="cm-bhint">{b.hint}</span>}
            </button>
          ))}
        </div>
        {open && (
          <Sheet title="Badge" onClose={() => setOpenId(null)}>
            <div className="cm-prof-top">
              <span className="cm-bglyph" style={{ background: open.tint, color: open.color, width: 72, height: 72 }}>
                <BadgeGlyph name={open.glyph} size={34} />
              </span>
              <p className="cm-prof-name">{open.title}</p>
              <p className="cm-prof-handle">{open.desc}</p>
              {open.earned ? (
                <span className="cm-prof-status">Earned {open.earnedOn}</span>
              ) : (
                <>
                  <div className="cm-prog" style={{ width: "100%" }}>
                    <i style={{ width: `${Math.round((open.progress || 0) * 100)}%` }} />
                  </div>
                  <p className="cm-bhint">{open.hint}</p>
                </>
              )}
            </div>
          </Sheet>
        )}
      </div>
    </>
  );
}
