-- ShrimpHero database, step 5 of 6: who may touch what.
-- The app only ever uses the public anon key. Visitors are "anon";
-- after the anonymous sign-in they are "authenticated".

alter table public.settings           enable row level security;
alter table public.stores             enable row level security;
alter table public.stores_import      enable row level security;
alter table public.profiles           enable row level security;
alter table public.entries            enable row level security;
alter table public.reports            enable row level security;
alter table public.nickname_blocklist enable row level security;

-- Start from nothing.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

-- New tables and functions created later also start closed.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- Own rows only.
grant select on public.profiles to authenticated;
grant select, delete on public.entries to authenticated;

drop policy if exists profiles_read_own on public.profiles;
create policy profiles_read_own on public.profiles
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists entries_read_own on public.entries;
create policy entries_read_own on public.entries
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists entries_delete_own on public.entries;
create policy entries_delete_own on public.entries
  for delete to authenticated using (user_id = (select auth.uid()));

-- settings, stores, stores_import, reports and nickname_blocklist: no policies, no grants.
-- Only the dashboard (admins) can read or change them.

-- Public read-only functions.
grant execute on function public.public_totals()                                  to anon, authenticated;
grant execute on function public.impact_settings()                                to anon, authenticated;
grant execute on function public.leaderboard()                                    to anon, authenticated;
grant execute on function public.store_map()                                      to anon, authenticated;
grant execute on function public.search_stores(text)                              to anon, authenticated;
grant execute on function public.nearby_stores(double precision, double precision) to anon, authenticated;

-- Functions for signed-in (anonymous) people.
grant execute on function public.set_nickname(text)                 to authenticated;
grant execute on function public.log_stickers(text, integer, date)  to authenticated;
grant execute on function public.my_rank()                          to authenticated;
grant execute on function public.my_entries()                       to authenticated;
grant execute on function public.delete_my_entry(bigint)            to authenticated;
grant execute on function public.delete_my_data()                   to authenticated;
grant execute on function public.report_nickname(text)              to authenticated;
