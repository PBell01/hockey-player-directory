-- supabase/migrations/20250321000000_hockey_staff_rls.sql
--
-- NOTE: This migration assumes scouting_notes and sports_science_records
-- tables exist with this project's real column names. Confirm and adjust
-- column references (e.g. owner/author fields) against the actual schema
-- before applying to the live database. staff_profiles does not exist yet
-- in this project and is created here. player_roster_shared_fields is not
-- given row-level policies in this file -- per the Open Questions in
-- rls-policy-spec.md, it may be better handled via column-level grants or
-- a view rather than RLS, and that decision is still open.

-- 0) staff_profiles: maps a signed-in auth user to a staff role.
create table if not exists public.staff_profiles (
  user_id uuid primary key references auth.users(id),
  role text not null check (role in ('coaching', 'scouting', 'medical'))
);

alter table public.staff_profiles enable row level security;

drop policy if exists "staff_profiles_select_own" on public.staff_profiles;
create policy "staff_profiles_select_own"
  on public.staff_profiles
  for select
  to authenticated
  using (
    user_id = auth.uid()
  );

-- 1) Role helper: resolve staff role for the signed-in user via auth.uid().
--    Never trust a role value sent from the client.
create or replace function public.current_staff_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.staff_profiles
  where user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.current_staff_role() from public;
grant execute on function public.current_staff_role() to authenticated;

-- 2) Enable RLS on sensitive tables named in rls-policy-spec.md.
alter table public.scouting_notes enable row level security;
alter table public.sports_science_records enable row level security;

-- =====================================================================
-- scouting_notes
-- Spec: SELECT allow scouting only; coaching deny; medical deny.
--       INSERT allow scouting only (author must be auth.uid()).
--       UPDATE allow scouting only, own-visible rows, cannot re-assign role.
--       DELETE deny all roles (Open Question 3 in spec -- default deny).
-- =====================================================================

-- SELECT: scouting -> rls-policy-spec.md "scouting_notes / SELECT / scouting: Yes"
drop policy if exists "scouting_notes_select_scouting_only" on public.scouting_notes;
create policy "scouting_notes_select_scouting_only"
  on public.scouting_notes
  for select
  to authenticated
  using (
    public.current_staff_role() = 'scouting'
  );
-- coaching and medical: no policy written -> denied by default under RLS.

-- INSERT: scouting only -> rls-policy-spec.md "scouting_notes / INSERT / scouting: Yes"
drop policy if exists "scouting_notes_insert_scouting_only" on public.scouting_notes;
create policy "scouting_notes_insert_scouting_only"
  on public.scouting_notes
  for insert
  to authenticated
  with check (
    public.current_staff_role() = 'scouting'
    -- TODO: confirm the real author/owner column name on scouting_notes
    -- (e.g. created_by) and add: and created_by = auth.uid()
  );

-- UPDATE: scouting only, same visibility as SELECT -> spec "scouting_notes / UPDATE / scouting: Yes"
drop policy if exists "scouting_notes_update_scouting_only" on public.scouting_notes;
create policy "scouting_notes_update_scouting_only"
  on public.scouting_notes
  for update
  to authenticated
  using (
    public.current_staff_role() = 'scouting'
  )
  with check (
    public.current_staff_role() = 'scouting'
  );

-- DELETE: default deny per Open Question 3 -- no policy written for any role.

-- =====================================================================
-- sports_science_records
-- Spec: SELECT allow medical only; coaching deny; scouting deny.
--       INSERT/UPDATE allow medical only. DELETE: Open Question 3 -- default deny.
--       STRICTEST table -- no USING (true) permitted here under any circumstance.
-- =====================================================================

-- SELECT: medical only -> spec "sports_science_records / SELECT / medical: Yes"
drop policy if exists "sports_science_records_select_medical_only" on public.sports_science_records;
create policy "sports_science_records_select_medical_only"
  on public.sports_science_records
  for select
  to authenticated
  using (
    public.current_staff_role() = 'medical'
    -- TODO: if Open Question 4 (caseload scoping) is resolved to "yes,
    -- scoped," add an additional caseload condition here, e.g.:
    -- and assigned_staff_id = auth.uid()
  );
-- coaching and scouting: no policy written -> denied by default under RLS.

-- INSERT: medical only -> spec "sports_science_records / INSERT / medical: Yes"
drop policy if exists "sports_science_records_insert_medical_only" on public.sports_science_records;
create policy "sports_science_records_insert_medical_only"
  on public.sports_science_records
  for insert
  to authenticated
  with check (
    public.current_staff_role() = 'medical'
  );

-- UPDATE: medical only -> spec "sports_science_records / UPDATE / medical: Yes"
drop policy if exists "sports_science_records_update_medical_only" on public.sports_science_records;
create policy "sports_science_records_update_medical_only"
  on public.sports_science_records
  for update
  to authenticated
  using (
    public.current_staff_role() = 'medical'
  )
  with check (
    public.current_staff_role() = 'medical'
  );

-- DELETE: default deny per Open Question 3 -- no policy written for any role.

-- =====================================================================
-- player_roster_shared_fields
-- Per rls-policy-spec.md, this is low-sensitivity directory data readable
-- by all three roles, but may live as columns on an existing table (e.g.
-- players) rather than its own table. Row-level security is not the right
-- tool if it's a column subset of a table that also holds private data --
-- that needs column-level grants or a view instead. No policy is written
-- here until that is decided (see rls-policy-spec.md Open Questions).
-- =====================================================================