-- ACTprep share links: allow the gaps (fill-in-the-blanks) section.
-- Run once in Supabase SQL editor (or psql). Safe to re-run.
-- Needed by GapsScreen save/share: link rows with section = 'gaps'
-- are otherwise rejected by the section check below. RLS policies,
-- expiry behavior, and the daily purge are unchanged.

alter table public.share_links drop constraint if exists share_links_section_check;
alter table public.share_links
  add constraint share_links_section_check
  check (section in ('reading', 'english', 'find', 'math', 'gaps'));
