-- supabase/migrations/20260418120000_least_privilege_new_staff_roles.sql
--
-- Sources:
--   docs/access/access-matrix-v2.md       (allow/deny decisions by role)
--   docs/access/overgrant-audit.md        (inventory of real tables/columns/screens)
--   docs/access/service-role-key-rule.md  (service-role key: allowed list is none)
--
-- Tables touched: public.staff_profiles, public.games, public.scouting_events
--   (the REAL tables from supabase/migrations/001_scouting_schema.sql -- this
--   migration does NOT use the placeholder names scouting_notes or
--   sports_science_records from 20250321000000_hockey_staff_rls.sql, since
--   those tables do not exist in this project's real schema.)
--
-- Per docs/access/overgrant-audit.md, no shared view with a medical-flag or
-- sports-science column was found, so no view is created or altered here.
--
-- Per docs/access/service-role-key-rule.md, the allowed list for the
-- service-role key is none. This migration does not reference that key and
-- does not grant assistant_scout or video_analyst any bypass of row-level
-- security.

-- 1) Allow the two new roles on staff_profiles.
--    TODO: confirm this matches the exact constraint name/shape created in
--    20250321000000_hockey_staff_rls.sql before applying.
alter table public.staff_profiles
  drop constraint if exists staff_profiles_role_check;

alter table public.staff_profiles
  add constraint staff_profiles_role_check
  check (role in ('coaching', 'scouting', 'medical', 'assistant_scout', 'video_analyst'));

-- 2) Ensure RLS is enabled on the real sensitive tables.
alter table public.games enable row level security;
alter table public.scouting_events enable row level security;

-- =====================================================================
-- scouting_events
-- Matrix: assistant_scout = See, Add. video_analyst = See.
--         coaching = Deny (no policy at all). scouting = See, Add, Change.
-- =====================================================================

-- assistant_scout: SELECT -> access-matrix-v2.md "Assistant scout / Scouting notes / See, Add"
drop policy if exists "scouting_events_select_assistant_scout" on public.scouting_events;
create policy "scouting_events_select_assistant_scout"
  on public.scouting_events
  for select
  to authenticated
  using (
    public.current_staff_role() = 'assistant_scout'
  );

-- assistant_scout: INSERT -> access-matrix-v2.md "Assistant scout / Scouting notes / See, Add"
drop policy if exists "scouting_events_insert_assistant_scout" on public.scouting_events;
create policy "scouting_events_insert_assistant_scout"
  on public.scouting_events
  for insert
  to authenticated
  with check (
    public.current_staff_role() = 'assistant_scout'
  );

-- video_analyst: SELECT only -> access-matrix-v2.md "Video analyst / Scouting notes / See"
drop policy if exists "scouting_events_select_video_analyst" on public.scouting_events;
create policy "scouting_events_select_video_analyst"
  on public.scouting_events
  for select
  to authenticated
  using (
    public.current_staff_role() = 'video_analyst'
  );

-- scouting: SELECT -> access-matrix-v2.md "Scouting / Scouting notes / See, Add, Change"
drop policy if exists "scouting_events_select_scouting" on public.scouting_events;
create policy "scouting_events_select_scouting"
  on public.scouting_events
  for select
  to authenticated
  using (
    public.current_staff_role() = 'scouting'
  );

-- scouting: INSERT -> access-matrix-v2.md "Scouting / Scouting notes / See, Add, Change"
drop policy if exists "scouting_events_insert_scouting" on public.scouting_events;
create policy "scouting_events_insert_scouting"
  on public.scouting_events
  for insert
  to authenticated
  with check (
    public.current_staff_role() = 'scouting'
  );

-- scouting: UPDATE -> access-matrix-v2.md "Scouting / Scouting notes / See, Add, Change"
drop policy if exists "scouting_events_update_scouting" on public.scouting_events;
create policy "scouting_events_update_scouting"
  on public.scouting_events
  for update
  to authenticated
  using (
    public.current_staff_role() = 'scouting'
  )
  with check (
    public.current_staff_role() = 'scouting'
  );

-- coaching: no policy written -> access-matrix-v2.md "Coaching / Scouting notes / Deny"
--   RLS default-deny means coaching gets zero rows and zero writes here.
-- medical: no policy written -> access-matrix-v2.md "Medical / Scouting notes / Deny" (implied; medical has no cell here at all)

-- =====================================================================
-- games
-- Matrix: assistant_scout = See. video_analyst = See.
--         coaching = See, Add. scouting = See.
-- =====================================================================

-- assistant_scout: SELECT -> access-matrix-v2.md "Assistant scout / Game data / See"
drop policy if exists "games_select_assistant_scout" on public.games;
create policy "games_select_assistant_scout"
  on public.games
  for select
  to authenticated
  using (
    public.current_staff_role() = 'assistant_scout'
  );

-- video_analyst: SELECT -> access-matrix-v2.md "Video analyst / Game data / See"
drop policy if exists "games_select_video_analyst" on public.games;
create policy "games_select_video_analyst"
  on public.games
  for select
  to authenticated
  using (
    public.current_staff_role() = 'video_analyst'
  );

-- coaching: SELECT -> access-matrix-v2.md "Coaching / Game data / See, Add"
drop policy if exists "games_select_coaching" on public.games;
create policy "games_select_coaching"
  on public.games
  for select
  to authenticated
  using (
    public.current_staff_role() = 'coaching'
  );

-- coaching: INSERT -> access-matrix-v2.md "Coaching / Game data / See, Add"
drop policy if exists "games_insert_coaching" on public.games;
create policy "games_insert_coaching"
  on public.games
  for insert
  to authenticated
  with check (
    public.current_staff_role() = 'coaching'
  );

-- scouting: SELECT -> access-matrix-v2.md "Scouting / Game data / See"
drop policy if exists "games_select_scouting" on public.games;
create policy "games_select_scouting"
  on public.games
  for select
  to authenticated
  using (
    public.current_staff_role() = 'scouting'
  );

-- No service-role references anywhere in this file. The allowed list in
-- docs/access/service-role-key-rule.md is none, and no row here grants
-- assistant_scout, video_analyst, or any other staff role a bypass of RLS.