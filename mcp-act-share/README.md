# mcp-act-share

MCP server that stores ACTprep tests in Supabase and returns a share link that
works for 24 hours, then auto-expires (RLS hides it instantly, pg_cron
reclaims the row — see `../supabase/share-links.sql`, run it once).

## Setup

1. Run `../supabase/share-links.sql` in Supabase SQL editor (one time).
2. `cd mcp-act-share && npm install`
3. Env (the MCP host passes these — see root `opencode.json`):
   - `SUPABASE_URL` — Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — preferred (bypasses RLS on insert)
     or `SUPABASE_ANON_KEY` (works: INSERT policy allows rows expiring ≤24h)
   - `SHARE_BASE_URL` — default `https://actprep.vercel.app`
4. `npm start` (stdio — no port; the host spawns it)

## Tools

- `generate_act_link({section, test, mode?})` — validates the test with the
  same rules as the app Start-from-JSON box, stores it, returns the URL:
  `https://actprep.vercel.app/<slug>` (bare form, as requested) plus the
  `/s/<slug>` alternate. Both render in the app. `?mode=timed` when asked.
- `get_shared_test({slug})` — verify a link (section/title/count/expiry).

## Shapes (the 3 types)

- reading: paras are plain strings; even-n answers use F,G,H,J.
- english: paras are span arrays `[{t}, {u:n,t}, {box:"A"}]`; answers A–D.
- find: paras are plain strings; questions carry `answers: [{para, text}]`
  verbatim spans — no options/answer keys.

Validation errors name the question (`Q3: …`) exactly like the app.
