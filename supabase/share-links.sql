-- ACTprep share links: 24h-expiring test payloads for /s/<slug> links.
-- Run this in Supabase SQL editor (or psql) once. Safe to re-run.
--
-- Correctness comes from RLS, not cleanup:
--   - the SELECT policy hides expired rows instantly (lazy expiry)
--   - the cron job below only reclaims storage (hard delete)

create table if not exists public.share_links (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  section    text not null check (section in ('reading', 'english', 'find')),
  title      text not null default 'Shared Test',
  test       jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table public.share_links enable row level security;

-- Grants are a separate gate from RLS: without them every anon call fails
-- with 42501 before any policy runs (new raw-SQL tables get no automatic
-- Data API grants). Strip broad defaults, then grant the minimum: anon may
-- insert new links and read live ones, nothing else. No update/delete
-- policy exists, so links are immutable over the API; only pg_cron (as
-- postgres owner) and service_role hard-delete expired rows.
revoke all on table public.share_links from anon, authenticated;
grant select, insert on table public.share_links to anon;

-- Allow the MCP server (anon key) to insert rows that expire within 24h.
-- The WITH CHECK pins expiry so a caller cannot create immortal rows.
drop policy if exists "anon can create share links" on public.share_links;
create policy "anon can create share links"
  on public.share_links for insert
  to anon
  with check (expires_at > now() and expires_at <= now() + interval '24 hours');

-- The app (anon key) reads only unexpired rows. This IS the lazy expiry:
-- after 24h the row is invisible to the API even before cleanup runs.
drop policy if exists "anon can read unexpired share links" on public.share_links;
create policy "anon can read unexpired share links"
  on public.share_links for select
  to anon
  using (expires_at > now());

-- No update/delete policy: share links are immutable over the API.

-- Storage reclamation: hard-delete expired rows daily at 03:30 UTC.
-- Requires the pg_cron extension (enable once in Database > Extensions).
create extension if not exists pg_cron;

select cron.schedule(
  'purge-expired-share-links',
  '30 3 * * *',
  $$ delete from public.share_links where expires_at < now() $$
);
