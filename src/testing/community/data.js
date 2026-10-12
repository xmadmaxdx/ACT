// Mock content for the Community multi-page demo. Pure module: no React, no DOM
// (Date only, for timestamps). Every id is stable so screens can deep-link.

export const ME = "me";

export const PEOPLE = [
  { id: "me", name: "You", handle: "@you", color: "#1899d6", online: true, streak: 16, lessons: 38, xp: 4250, joined: "May 2025" },
  { id: "ava", name: "Ava Bennett", handle: "@ava", color: "#1cb0f6", online: true, streak: 128, lessons: 84, xp: 12400, joined: "Mar 2025" },
  { id: "marco", name: "Marco Reyes", handle: "@marco", color: "#7b61b8", online: false, streak: 212, lessons: 156, xp: 31200, joined: "Jan 2025" },
  { id: "priya", name: "Priya Nair", handle: "@priya", color: "#58cc02", online: true, streak: 45, lessons: 61, xp: 8900, joined: "Jun 2025" },
  { id: "leo", name: "Leo Fontaine", handle: "@leo", color: "#ff9600", online: false, streak: 7, lessons: 22, xp: 2100, joined: "Sep 2025" },
  { id: "zoe", name: "Zoe Okafor", handle: "@zoe", color: "#ff4b4b", online: true, streak: 365, lessons: 240, xp: 52000, joined: "Oct 2024" },
  { id: "kai", name: "Kai Tanaka", handle: "@kai", color: "#00b8a9", online: false, streak: 33, lessons: 47, xp: 6400, joined: "Feb 2025" },
  { id: "nina", name: "Nina Alvarez", handle: "@nina", color: "#ce82ff", online: true, streak: 90, lessons: 102, xp: 18700, joined: "Apr 2025" },
  { id: "sam", name: "Sam Whitfield", handle: "@sam", color: "#026fd0", online: false, streak: 12, lessons: 30, xp: 3900, joined: "Jul 2025" },
];

export function personById(id) {
  return PEOPLE.find((p) => p.id === id) || null;
}

export const BADGES = [
  { id: "first-steps", title: "First Steps", desc: "Finish your very first lesson", glyph: "spark", color: "#1cb0f6", tint: "#ddf4ff", earned: true, earnedOn: "Jan 12" },
  { id: "sharpshooter", title: "Sharpshooter", desc: "Score 10 / 10 on any checkpoint", glyph: "target", color: "#58cc02", tint: "#f0f9df", earned: true, earnedOn: "Feb 03" },
  { id: "week-fire", title: "Week of Fire", desc: "Keep a 7-day streak alive", glyph: "flame", color: "#ff9600", tint: "#fff3e0", earned: true, earnedOn: "Feb 19" },
  { id: "night-owl", title: "Night Owl", desc: "Finish 5 lessons after 10 PM", glyph: "moon", color: "#7b61b8", tint: "#efe9fb", earned: true, earnedOn: "Mar 01" },
  { id: "marathon", title: "Marathon", desc: "Hold a 100-day streak", glyph: "flame", color: "#e5484d", tint: "#fff5f5", earned: false, progress: 0.64, hint: "64 / 100 days" },
  { id: "quiz-master", title: "Quiz Master", desc: "Ace 25 checkpoints in a row", glyph: "trophy", color: "#d9a406", tint: "#fff7e6", earned: false, progress: 0.44, hint: "11 / 25 checkpoint runs" },
  { id: "speedrunner", title: "Speedrunner", desc: "Finish a lesson under 4 minutes", glyph: "bolt", color: "#026fd0", tint: "#ddf4ff", earned: false, progress: 0.7, hint: "Personal best 4:12" },
  { id: "samaritan", title: "Good Samaritan", desc: "Answer 10 questions in Global", glyph: "heart", color: "#ff4b4b", tint: "#fff5f5", earned: false, progress: 0.3, hint: "3 / 10 answers" },
  { id: "scholar", title: "Scholar", desc: "Complete an entire course", glyph: "book", color: "#00b8a9", tint: "#e6fbf8", earned: false, progress: 0.55, hint: "11 / 20 skills" },
  { id: "perfect-week", title: "Perfect Week", desc: "Hit your daily goal 7 days straight", glyph: "star", color: "#ce82ff", tint: "#f7ecff", earned: false, progress: 0.85, hint: "6 / 7 days" },
];

export function badgeById(id) {
  return BADGES.find((b) => b.id === id) || null;
}

export const FEED_SEED = [
  { id: "a1", kind: "lesson", person: "ava", lesson: "Python · Loops & Iteration", correct: 10, total: 10, ago: "2m" },
  { id: "a2", kind: "streak", person: "marco", days: 212, ago: "14m" },
  { id: "a3", kind: "badge", person: "priya", badge: "sharpshooter", ago: "38m" },
  { id: "a4", kind: "lesson", person: "zoe", lesson: "Python · Dictionaries", correct: 9, total: 10, ago: "1h" },
  { id: "a5", kind: "badge", person: "nina", badge: "night-owl", ago: "2h" },
  { id: "a6", kind: "streak", person: "zoe", days: 365, ago: "3h" },
  { id: "a7", kind: "lesson", person: "kai", lesson: "Python · List Comprehensions", correct: 8, total: 10, ago: "5h" },
  { id: "a8", kind: "streak", person: "priya", days: 45, ago: "7h" },
  { id: "a9", kind: "badge", person: "marco", badge: "week-fire", ago: "9h" },
  { id: "a10", kind: "lesson", person: "nina", lesson: "Python · String Methods", correct: 10, total: 10, ago: "11h" },
  { id: "a11", kind: "lesson", person: "leo", lesson: "Python · Variables & Types", correct: 7, total: 10, ago: "14h" },
  { id: "a12", kind: "streak", person: "ava", days: 128, ago: "1d" },
];

// Pulled in one at a time by the feed's refresh button so new cards animate in.
export const FEED_INCOMING = [
  { id: "n1", kind: "badge", person: "kai", badge: "perfect-week", ago: "now" },
  { id: "n2", kind: "lesson", person: "sam", lesson: "Python · Functions Basics", correct: 10, total: 10, ago: "now" },
  { id: "n3", kind: "streak", person: "nina", days: 91, ago: "now" },
];

export const CHATS = [
  { id: "c1", person: "ava", unread: 2 },
  { id: "c2", person: "marco", unread: 0 },
  { id: "c3", person: "priya", unread: 1 },
  { id: "c4", person: "nina", unread: 0 },
  { id: "c5", person: "zoe", unread: 0 },
];

export function chatById(id) {
  return CHATS.find((c) => c.id === id) || null;
}

export const SEED_MESSAGES = {
  c1: [
    { id: "c1m1", from: "ava", kind: "text", text: "Morning! Did you get through the nesting loop challenge?", time: "09:31" },
    { id: "c1m2", from: "me", kind: "text", text: "Barely 😅 the off-by-one caught me twice", time: "09:32", status: "read" },
    { id: "c1m3", from: "ava", kind: "voice", dur: 14, time: "09:33" },
    { id: "c1m4", from: "ava", kind: "text", text: "Watch the boundary on the second loop — that is the whole trick.", time: "09:33", replyTo: { from: "me", text: "Barely 😅 the off-by-one caught me twice" } },
    { id: "c1m5", from: "me", kind: "text", text: "That fixed it. 10 / 10 🎉", time: "09:36", status: "read", reactions: [{ emoji: "🎉", by: ["ava"] }] },
    { id: "c1m6", from: "ava", kind: "file", file: { name: "loop-boundaries-cheatsheet.pdf", size: "1.2 MB", type: "PDF" }, time: "09:38" },
    { id: "c1m7", from: "ava", kind: "text", text: "Print that one above your desk. Works for every range bug.", time: "09:38" },
  ],
  c2: [
    { id: "c2m1", from: "me", kind: "text", text: "Sending you my dictionary notes — the key lookup table helped a lot.", time: "Yesterday", status: "read" },
    { id: "c2m2", from: "marco", kind: "photo", caption: "My setup for the weekend grind", time: "Yesterday" },
    { id: "c2m3", from: "marco", kind: "text", text: "Clean desk, clean mind. Also: `.get()` with a default saves so many KeyErrors.", time: "Yesterday", reactions: [{ emoji: "💯", by: ["me"] }] },
    { id: "c2m4", from: "me", kind: "text", text: "Adding that to my notes right now", time: "Yesterday", status: "read" },
  ],
  c3: [
    { id: "c3m1", from: "priya", kind: "text", text: "Are you joining the Saturday speed-run?", time: "08:12" },
    { id: "c3m2", from: "me", kind: "text", text: "What time does it start?", time: "08:15", status: "read" },
    { id: "c3m3", from: "priya", kind: "text", text: "10 AM sharp. Twenty questions, one hour, no calculator.", time: "08:16" },
    { id: "c3m4", from: "priya", kind: "text", text: "I made a practice set if you want it — it is brutal but fair.", time: "08:16" },
  ],
  c4: [
    { id: "c4m1", from: "nina", kind: "text", text: "Thank you for the recursion explanation, it finally clicked 🙏", time: "Mon", status: "read" },
    { id: "c4m2", from: "me", kind: "text", text: "The stack picture is what did it for me too", time: "Mon", status: "read" },
    { id: "c4m3", from: "nina", kind: "text", text: "", time: "Mon", deleted: true },
    { id: "c4m4", from: "nina", kind: "voice", dur: 9, time: "Mon" },
  ],
  c5: [
    { id: "c5m1", from: "zoe", kind: "text", text: "365 days. One full year of not missing a single day.", time: "Sun" },
    { id: "c5m2", from: "me", kind: "text", text: "That is unreal. What keeps you going?", time: "Sun", status: "read" },
    { id: "c5m3", from: "zoe", kind: "text", text: "Two minutes before bed. Non-negotiable, like brushing my teeth.", time: "Sun" },
  ],
};

export const GLOBAL_ROOM = {
  name: "# general",
  members: 1284,
  pinned: "Be kind, stay on topic, no spoilers for tomorrow's checkpoint.",
};

export const GLOBAL_SEED = [
  { id: "g1", kind: "system", text: "Zoe Okafor joined the room", time: "09:04" },
  { id: "g2", from: "nina", kind: "text", text: "Morning everyone — who is on the strings checkpoint today?", time: "09:06" },
  { id: "g3", from: "kai", kind: "text", text: "Me. Slicing is still frying my brain.", time: "09:07" },
  { id: "g4", from: "nina", kind: "text", text: "Remember: s[a:b] stops at b, it never includes it.", time: "09:07", reactions: [{ emoji: "🙏", by: ["me"] }] },
  { id: "g5", kind: "system", text: "Sam Whitfield pinned a message", time: "09:09" },
  { id: "g6", from: "sam", kind: "text", text: "Dropping the practice set from Saturday in #resources — 20 questions, answers included.", time: "09:10" },
  { id: "g7", from: "priya", kind: "text", text: "That set is mean. I love it.", time: "09:11", reactions: [{ emoji: "😂", by: ["kai"] }, { emoji: "🔥", by: ["me"] }] },
  { id: "g8", from: "zoe", kind: "voice", dur: 11, time: "09:13" },
  { id: "g9", kind: "system", text: "Ava Bennett reached a 128-day streak", time: "09:15" },
];

export const GLOBAL_REPLIES = [
  { from: "kai", text: "Ha, same here — I had to read that three times." },
  { from: "nina", text: "Exactly. The off-by-one is the whole game." },
  { from: "priya", text: "Dropping a link in #resources in a minute." },
  { from: "sam", text: "Welcome in 👋" },
  { from: "zoe", text: "Two minutes a day. That is all it takes." },
  { from: "marco", text: "Agreed. Consistency beats intensity every time." },
];

export const REPLIES = {
  c1: [
    "Right? It is always the boundary.",
    "Send me your attempt, I will mark it up.",
    "Nice one — that is a clean 10 / 10.",
    "Want to race the next checkpoint?",
  ],
  c2: [
    "Got it, reading now.",
    "That is a much better way to frame it.",
    "Adding it to the shared notes.",
    "Let us compare scores after the run.",
  ],
  c3: [
    "Perfect, see you at 10.",
    "I will send the practice set over.",
    "Bring a timer, it goes fast.",
    "Deal 🎯",
  ],
  c4: [
    "So glad it clicked!",
    "The stack picture really is the key.",
    "Anytime 🙌",
    "Let me know if the base case trips you up.",
  ],
  c5: [
    "Two minutes before bed. Non-negotiable.",
    "Streaks are just promises you keep to yourself.",
    "You are one week away from Week of Fire 🔥",
    "Keep going — 100 is closer than it looks.",
  ],
  _default: [
    "Got it 👍",
    "That makes sense.",
    "Let me think about that and get back to you.",
    "Nice — tell me more.",
  ],
};

export function replyFor(chatId) {
  const list = REPLIES[chatId] || REPLIES._default;
  return list[Math.floor(Math.random() * list.length)];
}

// ---------- helpers ----------

const SUB_TITLES = {
  feed: "Activity feed",
  chats: "Chats",
  global: "Global chat",
  badges: "Badges",
  people: "People",
  person: "Member profile",
};

export function titleForSub(sub) {
  const seg = String(sub || "feed").split("/")[0];
  return SUB_TITLES[seg] || "Community";
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Deterministic waveform so a given voice note always renders the same bars.
export function makePeaks(seedText, n = 30) {
  let a = hash(String(seedText));
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [];
  for (let i = 0; i < n; i++) {
    const env = Math.sin((i / (n - 1)) * Math.PI) * 0.4 + 0.6;
    out.push(Math.max(0.16, Math.min(1, (0.35 + next() * 0.65) * env)));
  }
  return out;
}

export function fmtDur(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function stamp() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
