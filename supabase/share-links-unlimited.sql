-- ACTprep share links: allow extended and never-expiring links.
-- Run once in Supabase SQL editor (or psql). Safe to re-run.
-- Lets the service_role-only update tool extend a link's expiry (custom
-- days) or clear it (NULL = never expires). Anon generation caps
-- (share-links-expiry.sql) stay as-is; anon reads gain NULL rows.
-- The daily pg_cron purge (`expires_at < now()`) ignores NULLs, so
-- never-expiring rows survive cleanup automatically.

alter table public.share_links alter column expires_at drop not null;

drop policy if exists "anon can read unexpired share links" on public.share_links;
create policy "anon can read unexpired share links"
  on public.share_links for select
  to anon
  using (expires_at is null or expires_at > now());
