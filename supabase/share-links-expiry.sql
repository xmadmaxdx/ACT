-- ACTprep share links: extend max expiry from 24h to 30 days.
-- Run once in Supabase SQL editor (or psql). Safe to re-run.
-- Needed by the app's Save dialog, which offers 1/2/3/7/30-day expiries.
-- The anon read policy (unexpired only) and daily pg_cron purge are unchanged.

drop policy if exists "anon can create share links" on public.share_links;
create policy "anon can create share links"
  on public.share_links for insert
  to anon
  with check (expires_at > now() and expires_at <= now() + interval '30 days');
