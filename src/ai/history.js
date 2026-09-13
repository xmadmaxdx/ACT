// Codino AI — localStorage thread store. Threads survive reloads; newest first.

const KEY = "codino-threads-v1";
const MAX_THREADS = 25;

export function makeThread({ title, testId, qn }) {
  return {
    id: `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
    title: title || "General chat",
    testId: testId || null,
    qn: qn === undefined || qn === null ? null : qn,
    messages: [],
    updatedAt: Date.now(),
  };
}

export function loadThreads() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function persistThreads(threads) {
  const slim = (list) => (list || []).slice(0, MAX_THREADS);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(slim(threads)));
    return;
  } catch {
    /* quota hit (image data) — retry without attached images */
  }
  try {
    const stripped = slim(threads).map((t) => ({
      ...t,
      messages: (t.messages || []).map((m) => {
        if (!m.images) return m;
        const next = { ...m };
        delete next.images;
        return next;
      }),
    }));
    window.localStorage.setItem(KEY, JSON.stringify(stripped));
  } catch {
    /* storage blocked — chat still works for this session */
  }
}
