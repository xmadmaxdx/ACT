// Mock content for the Codino Agent demo. Pure module: no React, no DOM.
// Copy stays short on purpose — the UI must breathe.

export const ME = "me";

export const MODELS = [
  { id: "auto", name: "Codino 1", tag: "Auto", desc: "Best for most tasks" },
  { id: "max", name: "Codino 1 Max", tag: "Max", desc: "Hard problems" },
  { id: "mini", name: "Codino Mini", tag: "Fast", desc: "Quick answers" },
];

export const SESSIONS = [
  { id: "s1", title: "Fix auth loop bug", preview: "Guard runs before session…", time: "2m", count: 7, model: "1", pinned: true, active: true },
  { id: "s2", title: "Explain recursion", preview: "A stack of plates…", time: "1h", count: 4, model: "1" },
  { id: "s3", title: "Build todo CLI", preview: "Commands scaffolded…", time: "3h", count: 9, model: "Max" },
  { id: "s4", title: "Refactor utils", preview: "Split into 3 modules…", time: "Yesterday", count: 5, model: "1" },
  { id: "s5", title: "Regex help", preview: "Match the domain…", time: "Mon", count: 3, model: "Mini" },
  { id: "s6", title: "Old experiment", preview: "Streaming test…", time: "Sun", count: 2, model: "1", archived: true },
];

export const QUICK = ["Explain this error", "Write a test", "Refactor it", "Find the bug"];

export const SLASH = [
  { cmd: "/fix", desc: "Fix the pasted error" },
  { cmd: "/test", desc: "Generate tests" },
  { cmd: "/refactor", desc: "Clean up code" },
  { cmd: "/explain", desc: "Explain simply" },
  { cmd: "/docs", desc: "Write docs" },
];

export const SUGGESTIONS = [
  { id: "debug", title: "Debug code", sub: "paste the error", tile: "t-amber", text: "Help me debug this: " },
  { id: "build", title: "Build it", sub: "from a sentence", tile: "t-green", text: "Build me a tiny CLI that " },
  { id: "tests", title: "Write tests", sub: "cover the edges", tile: "t-blue", text: "Write tests for " },
  { id: "learn", title: "Teach me", sub: "plain words", tile: "t-purple", text: "Explain like I'm five: " },
];

export const AGENT_CODE_INTRO = "Found it — the guard redirects before the session loads.";
export const AGENT_CODE = "if (!session) return redirect('/login');\nawait loadSession();";
export const AGENT_CODE_OUTRO = "Move the check below `loadSession()` and the loop is gone.";

export const AGENT_ALT = "Short version: load the session first, then guard. One-line move.";

export const RUN_INTRO = "On it — reading the file, then patching the guard.";
export const RUN_OUTRO = "Patched and green. The loop is gone.";
export const RUN_DENIED = "Skipped. The file is untouched.";

export const TEST_INTRO = "Done. Added `login.test.js`:";
export const TEST_LIST = "- covers an empty session\n- covers an expired token";
export const TEST_CODE = "test('empty session redirects', () => {\n  expect(guard(null)).toBe('/login');\n});";
export const TEST_OUTRO = "3 passed in 1.1s.";

export const FULL_RESULT = "$ npm test\n\nPASS src/login.test.js\n  pass · empty session (4ms)\n  pass · expired token (2ms)\n  pass · valid session (1ms)\n\n3 passed · 0 failed · 1.1s";

export const THREAD_SEED = [
  { id: "t1", role: "user", text: "My login page loops forever. Help.", time: "09:28" },
  { id: "a0", role: "agent", time: "09:28", stage: "done", text: "Show me the guard — paste `src/auth.js`, or **let me read it** myself.", stats: { tokens: "0.3k", time: "1.2s", cost: "$0.001" } },
  { id: "t2", role: "user", text: "Just read it yourself.", time: "09:29" },
  {
    id: "a1",
    role: "agent",
    time: "09:31",
    stage: "done",
    subagent: { name: "explore", why: "trace the auth flow" },
    skills: ["refactor"],
    hooks: ["on-edit"],
    tools: [
      { id: "tool1", name: "read src/auth.js", status: "done", dur: "0.4s", args: "{ path: \"src/auth.js\" }", result: "42 lines · guard at line 12" },
      { id: "tool2", name: "run npm test", status: "done", dur: "1.1s", args: "{ cmd: \"npm test\" }", result: "3 passed · 0 failed" },
    ],
    groupDur: "1.5s",
    text: AGENT_CODE_INTRO,
    code: { lang: "JS", body: AGENT_CODE },
    outro: AGENT_CODE_OUTRO,
    diff: { file: "src/auth.js", plus: 3, minus: 1, unified: "@@ line 12\n- if (!session) redirect();\n- await loadSession();\n+ await loadSession();\n+ if (!session) redirect();" },
    branches: [null, "alt"],
    branch: 0,
    context: { used: 18, of: 200 },
    stats: { tokens: "1.2k", time: "4.1s", cost: "$0.002" },
  },
  { id: "c0", kind: "compact", text: "Context compacted · 42k → 18k" },
  { id: "t3", role: "user", text: "Now write a test for the fix.", time: "09:36" },
  {
    id: "a2",
    role: "agent",
    time: "09:36",
    stage: "done",
    tools: [
      { id: "tool3", name: "write login.test.js", status: "done", dur: "0.5s", args: '{ file: "login.test.js" }', result: "1 file · 9 lines" },
      { id: "tool4", name: "$ npm test", status: "done", dur: "1.1s", cmd: true, args: '{ cmd: "npm test" }', result: "3 passed · 0 failed", exit: 0 },
    ],
    groupDur: "1.6s",
    text: `${TEST_INTRO}\n${TEST_LIST}`,
    code: { lang: "JS", body: TEST_CODE },
    outro: TEST_OUTRO,
    link: { site: "docs.codino.dev", title: "Testing guards", url: "https://docs.codino.dev/guards" },
    context: { used: 24, of: 200 },
    stats: { tokens: "1.6k", time: "5.8s", cost: "$0.003" },
  },
];

export const TASK_LIST = [
  { id: "k1", name: "Run tests", status: "run", progress: 62 },
  { id: "k2", name: "Lint changed files", status: "queued", progress: 0 },
  { id: "k3", name: "Nightly audit", status: "done", progress: 100 },
];

export const MCP_SERVERS = [
  { id: "m1", name: "files", tools: 6, on: true },
  { id: "m2", name: "shell", tools: 4, on: true },
  { id: "m3", name: "web", tools: 2, on: false },
];

export const FILES = [
  { id: "f1", path: "src/auth.js", kind: "js", size: "1.2 KB", body: "import { redirect } from './router';\n\nexport async function guard(session) {\n  await loadSession();\n  if (!session) return redirect('/login');\n  return true;\n}" },
  { id: "f2", path: "src/login.test.js", kind: "js", size: "0.4 KB", body: "test('empty session redirects', () => {\n  expect(guard(null)).toBe('/login');\n});" },
  { id: "f3", path: "README.md", kind: "md", size: "0.8 KB", body: "# codino demo\n\nA tiny auth example.\n\n- guard the routes\n- test the guard" },
];

export const FILE_VERSIONS = [
  { id: "v3", name: "v3 · current", when: "today" },
  { id: "v2", name: "v2", when: "yesterday" },
  { id: "v1", name: "v1", when: "last week" },
];

export function agentTitleForSub(sub) {
  const seg = String(sub || "").split("/")[0];
  if (seg === "s") return "Working session";
  if (seg === "settings") return "Settings";
  if (seg === "files") return "Files";
  if (seg === "welcome") return "Welcome";
  return "Codino Agent";
}

export function stamp() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
