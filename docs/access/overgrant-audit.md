# Overgrant audit

This file lists access that already exists. It does not rebuild staff sign-in, server session checks, or row-level security policies. It does not decide when the service-role key may be used, it is not access matrix v2, and it contains no new database commands that create or change policies.

Source brief: docs/access/new-roles-brief.md

## Roles judged

- Assistant scout: may view and log scouting observations/events for players and games, and may view game schedules and results. Must not see medical data, sports-science data, or medical flags.
- Video analyst: may view existing scouting notes for context, but does not create or edit scouting notes. May view game schedules, results, and in-game events in detail. Must not see medical data, sports-science data, or medical flags.
- Existing roles from the brief: coaching, scouting, medical.

Sealed rule, in my words: medical and sports-science data, including medical flags on shared screens, stay sealed from jobs that do not need them, especially assistant scouts and video analysts.

## Where I looked

- Paths searched: src/, supabase/, docs/, app/; specifically schema and migrations, src/types/database.ts, src/lib/scouting/, src/server/, app/server/, all route files under src/routes/, the role brief, the role matrix, the RLS policy spec, the authentication/session notes, and the security handoff.
- Search words: medical, sports-science, sports science, injury, health, medical flag, sports_science_records, scouting_notes, staff_profiles, RLS, row level security, policy, service_role, SUPABASE_SERVICE_ROLE_KEY, create table, create view.

## Inventory

Who can reach it is stated only from executable code, grants, or migration contents. Where those files do not state a role, this audit says `unknown — not stated in the files`.

### Tables

| Name | File path | Who can reach it | What it holds, in plain words |
| --- | --- | --- | --- |
| directory_entries | src/types/database.ts; app/server/directory.ts | service role through `getDirectoryEntries`; other callers are unknown — not stated in the files | Directory entries with name, role, position/title, jersey number, team, and active status. |
| players | supabase/migrations/001_scouting_schema.sql; supabase/migrations/003_player_notes.sql; src/types/database.ts | Browser Supabase client callers in `src/lib/scouting/queries.ts` and `src/lib/scouting/mutations.ts`; role reach is unknown — not stated in the files. | Players, positions, team or organization labels, creation time, and a free-text notes field. |
| games | supabase/migrations/001_scouting_schema.sql; src/types/database.ts | Browser Supabase client callers in `src/lib/scouting/queries.ts` and `src/lib/scouting/mutations.ts`; role reach is unknown — not stated in the files. | Opponents, game dates, venues, home/away status, and creation time. |
| scouting_events | supabase/migrations/001_scouting_schema.sql; src/types/database.ts | Browser Supabase client callers in `src/lib/scouting/queries.ts` and `src/lib/scouting/mutations.ts`; authenticated server client in `src/server/scouting-notes.ts`; role reach is unknown — not stated in the files. | Player-game observations with event type, period, clock time, notes, and creation time. |
| staff_profiles | supabase/migrations/20250321000000_hockey_staff_rls.sql | unknown — not stated in the files; the migration declares it but no population or live deployment is shown | An auth user ID and one of the planned roles: coaching, scouting, or medical. |
| scouting_notes | supabase/migrations/20250321000000_hockey_staff_rls.sql; docs/security/rls-policy-spec.md | unknown — not stated in the files; the migration references this logical table but the real schema contains `scouting_events` instead | Planned logical scouting-note data; no real table definition or real columns are present in the searched schema. |
| sports_science_records | supabase/migrations/20250321000000_hockey_staff_rls.sql; docs/security/rls-policy-spec.md | unknown — not stated in the files; no real table definition exists | Planned logical medical or sports-science data; no real table or columns exist in the searched schema. |
| player_roster_shared_fields | docs/security/rls-policy-spec.md; supabase/migrations/20250321000000_hockey_staff_rls.sql | unknown — not stated in the files; no table is created and no policy is written | Planned limited shared directory fields, such as player name and position. |

### Columns

| Table | Column | File path | Who can reach it | Could this be medical or sports-science? |
| --- | --- | --- | --- | --- |
| directory_entries | id | src/types/database.ts; app/server/directory.ts | service role through `getDirectoryEntries`; other callers unknown — not stated in the files | no |
| directory_entries | full_name | src/types/database.ts; app/server/directory.ts | service role through `getDirectoryEntries`; shown on `/directory` to an unknown audience — role is not stated in the files | no |
| directory_entries | role | src/types/database.ts; app/server/directory.ts | service role through `getDirectoryEntries`; shown on `/directory` to an unknown audience — role is not stated in the files | no |
| directory_entries | position_or_title | src/types/database.ts; app/server/directory.ts | service role through `getDirectoryEntries`; shown on `/directory` to an unknown audience — role is not stated in the files | no |
| directory_entries | jersey_number | src/types/database.ts; app/server/directory.ts | service role through `getDirectoryEntries`; shown on `/directory` to an unknown audience — role is not stated in the files | no |
| directory_entries | team_name | src/types/database.ts; app/server/directory.ts | service role through `getDirectoryEntries`; shown on `/directory` to an unknown audience — role is not stated in the files | no |
| directory_entries | is_active | src/types/database.ts; app/server/directory.ts | service role through `getDirectoryEntries`; shown on `/directory` to an unknown audience — role is not stated in the files | no |
| players | id | supabase/migrations/001_scouting_schema.sql; src/types/database.ts | browser Supabase client callers; role is unknown — not stated in the files | no |
| players | name | supabase/migrations/001_scouting_schema.sql; src/types/database.ts | browser Supabase client callers; shown by player and scouting screens; role is unknown — not stated in the files | no |
| players | position | supabase/migrations/001_scouting_schema.sql; src/types/database.ts | browser Supabase client callers; shown by player and scouting screens; role is unknown — not stated in the files | no |
| players | team_org_label | supabase/migrations/001_scouting_schema.sql; src/types/database.ts | browser Supabase client callers; shown by scouting screens; role is unknown — not stated in the files | no |
| players | created_at | supabase/migrations/001_scouting_schema.sql; src/types/database.ts | browser Supabase client callers; role is unknown — not stated in the files | no |
| players | notes | supabase/migrations/003_player_notes.sql; src/types/database.ts; src/lib/scouting/mutations.ts | browser Supabase client callers; role is unknown — not stated in the files | unknown |
| games | id | supabase/migrations/001_scouting_schema.sql; src/types/database.ts | browser Supabase client callers; role is unknown — not stated in the files | no |
| games | opponent | supabase/migrations/001_scouting_schema.sql; src/types/database.ts | browser Supabase client callers; shown on game and scouting screens; role is unknown — not stated in the files | no |
| games | game_date | supabase/migrations/001_scouting_schema.sql; src/types/database.ts | browser Supabase client callers; shown on game and scouting screens; role is unknown — not stated in the files | no |
| games | venue | supabase/migrations/001_scouting_schema.sql; src/types/database.ts | browser Supabase client callers; shown on game and scouting screens; role is unknown — not stated in the files | no |
| games | home_away_status | supabase/migrations/001_scouting_schema.sql; src/types/database.ts | browser Supabase client callers; role is unknown — not stated in the files | no |
| games | created_at | supabase/migrations/001_scouting_schema.sql; src/types/database.ts | browser Supabase client callers; role is unknown — not stated in the files | no |
| scouting_events | id | supabase/migrations/001_scouting_schema.sql; src/types/database.ts | browser Supabase client callers and the authenticated server function; role is unknown — not stated in the files | no |
| scouting_events | player_id | supabase/migrations/001_scouting_schema.sql; src/types/database.ts | browser Supabase client callers and the authenticated server function; shown by scouting screens; role is unknown — not stated in the files | no |
| scouting_events | game_id | supabase/migrations/001_scouting_schema.sql; src/types/database.ts | browser Supabase client callers and the authenticated server function; shown by scouting screens; role is unknown — not stated in the files | no |
| scouting_events | event_type | supabase/migrations/001_scouting_schema.sql; src/types/database.ts | browser Supabase client callers and the authenticated server function; shown by scouting screens; role is unknown — not stated in the files | no |
| scouting_events | period | supabase/migrations/001_scouting_schema.sql; src/types/database.ts | browser Supabase client callers and the authenticated server function; shown by scouting screens; role is unknown — not stated in the files | no |
| scouting_events | clock_time | supabase/migrations/001_scouting_schema.sql; src/types/database.ts | browser Supabase client callers and the authenticated server function; shown by scouting screens; role is unknown — not stated in the files | no |
| scouting_events | notes | supabase/migrations/001_scouting_schema.sql; src/types/database.ts | browser Supabase client callers and the authenticated server function; shown by scouting screens; role is unknown — not stated in the files | unknown |
| scouting_events | created_at | supabase/migrations/001_scouting_schema.sql; src/types/database.ts | browser Supabase client callers and the authenticated server function; role is unknown — not stated in the files | no |
| staff_profiles | user_id | supabase/migrations/20250321000000_hockey_staff_rls.sql | unknown — not stated in the files | no |
| staff_profiles | role | supabase/migrations/20250321000000_hockey_staff_rls.sql | unknown — not stated in the files; intended role lookup is via `current_staff_role()` for authenticated callers | no |
| scouting_notes | real columns | supabase/migrations/20250321000000_hockey_staff_rls.sql | unknown — not stated in the files | unknown |
| sports_science_records | real columns | supabase/migrations/20250321000000_hockey_staff_rls.sql | unknown — not stated in the files | yes |

### Database views

| Name | File path | Who can reach it | Includes medical or sports-science fields? |
| --- | --- | --- | --- |
| None found | src/types/database.ts; supabase/; docs/ | unknown — not stated in the files | unknown |

### Server functions

Server functions are server-side code that screens can call, plus the database RPC function declared in the migrations.

| Name | File path | Who can call it | What data it can return |
| --- | --- | --- | --- |
| getDirectoryEntries | app/server/directory.ts | unknown — not stated in the files; implementation uses the service role | Directory entries: id, full name, role, position/title, jersey number, team, and active status. |
| listScoutingNotes | src/server/scouting-notes.ts | authenticated session required by `requireSession()` | Selected `scouting_events` rows: id, game_id, player_id, event_type, notes, period, clock_time, and created_at. |
| getCurrentStaff | src/server/get-current-staff.ts | unknown — not stated in the files; handler calls `requireSession()` | The current authenticated user's id and email. |
| player_event_counts_for_game | supabase/migrations/002_scouting_aggregates_rpc.sql; src/lib/scouting/rpc.ts | anon, authenticated, and service role, because the migration grants execution to all three | Player id, player name, total event count, and goal count for one game. The function is `security invoker`. |
| listPlayers | src/server/directoryLoader.ts | called by the home route; role is unknown — not stated in the files | Seed player objects from `src/data/hockeySeed.ts`, not database rows. |
| getPlayerById | src/server/directoryLoader.ts | called by the player detail route; role is unknown — not stated in the files | One seed player object or no result. |
| listGames | src/server/directoryLoader.ts | called by the home route and games route; role is unknown — not stated in the files | Seed game objects from `src/data/hockeySeed.ts`, not database rows. |
| getDirectoryEntries | app/server/directory.ts | called by `/directory`; role is unknown — not stated in the files | Directory rows read through the service-role server client. |
| requireSession | src/lib/auth/require-session.ts | called by server functions; role is unknown — not stated in the files | The current authenticated user's id and email, or an unauthorized error. |

### Shared screens

These route files contain no role-based route guard. The files therefore do not state which staff roles may open them; the exact access is `unknown — not stated in the files`.

| Screen or route | File path | Who can open it | Medical or sports-science fields shown? |
| --- | --- | --- | --- |
| Home | src/routes/index.tsx | unknown — not stated in the files | no |
| Directory | src/routes/directory.tsx | unknown — not stated in the files | no |
| Games | src/routes/games/index.tsx | unknown — not stated in the files | no |
| Players | src/routes/players/index.tsx | unknown — not stated in the files | no |
| Player detail | src/routes/players/$playerId.tsx | unknown — not stated in the files | no |
| Scouting index | src/routes/scouting/index.tsx | unknown — not stated in the files; loader displays a sign-in message when `requireSession()` rejects | no |
| Scouting events | src/routes/scouting/events.tsx | unknown — not stated in the files | no |
| Scouting players | src/routes/scouting/players.tsx | unknown — not stated in the files | no |
| Scouting aggregates | src/routes/scouting/aggregates.tsx | unknown — not stated in the files | no |
| Login | src/routes/login.tsx | unknown — not stated in the files | no |

## Medical and sports-science paths

The repository search found planning and policy references, but no real medical table, sports-science table, medical column, injury field, health field, medical flag, or medical screen. The logical `sports_science_records` target exists only as an unapplied migration reference.

| Item | Kind | File path | Who can reach it | Who must not reach it |
| --- | --- | --- | --- | --- |
| sports_science_records | table target in migration, not a real schema table | supabase/migrations/20250321000000_hockey_staff_rls.sql; docs/security/rls-policy-spec.md | unknown — not stated in the files; no real table exists | Assistant scout and video analyst must not receive it under the brief; coaching and scouting are also denied by the policy intent, but current live enforcement is not shown |
| players.notes | column with generic free-text name | supabase/migrations/003_player_notes.sql; src/types/database.ts | browser Supabase client callers; role is unknown — not stated in the files | Assistant scout and video analyst must not receive medical content if this field is later used for it; current files do not identify its contents as medical |
| scouting_events.notes | column with generic free-text name | supabase/migrations/001_scouting_schema.sql; src/types/database.ts | browser Supabase client callers and authenticated `listScoutingNotes`; role is unknown — not stated in the files | Assistant scout and video analyst must not receive medical content if this field is later used for it; current files do not identify its contents as medical |
| Medical flag on shared screens | screen field | src/routes/; docs/access/new-roles-brief.md | no implementation found; unknown — not stated in the files | Assistant scout and video analyst must not receive it |

## Learner marks: broader than the job


## Disagreements and unknowns

- Brief versus existing files: the brief names assistant scout and video analyst, but no code or role mapping implements either role. The brief says the existing coaching, scouting, and medical roles already have access boundaries; the live code does not state those role boundaries for the real `players`, `games`, `scouting_events`, or `directory_entries` paths. The brief seals medical and sports-science data from the two new jobs, but no corresponding live medical data path exists.
- Service-role uses noticed, with no rule written here: `getDirectoryEntries` calls `getSupabaseServerClient()` with `serverEnv.supabaseServiceRoleKey` in app/server/directory.ts. The service role is also an explicit execution grantee for `player_event_counts_for_game` in supabase/migrations/002_scouting_aggregates_rpc.sql. No additional service-role use was found in the searched executable code.
- Other unknowns: role assignment and live `staff_profiles` population are not shown; no migration application record is present; the RLS migration references `scouting_notes` and `sports_science_records`, not the real `scouting_events` table; medical caseload scope, delete permissions, and ownership fields remain unresolved in docs/security/rls-policy-spec.md.

### RLS finding for the real tables

`ENABLE ROW LEVEL SECURITY` is not present for `players`, `games`, or `scouting_events` in the real schema migration. The only RLS statements for those names are absent. The committed migration `supabase/migrations/20250321000000_hockey_staff_rls.sql` enables RLS on `staff_profiles`, `scouting_notes`, and `sports_science_records`, but those are not the real data tables used by the app, and the repository documentation says the scouting schema migration has not been applied to Supabase. Therefore RLS is not shown as applied to `players`, `games`, or `scouting_events`; at most, RLS is written in a committed but unapplied migration for different logical table names.

## Review notes

- I compared names to files: yes
- I did not ask for app-code or SQL edits in this step: yes
- Refine pass: audited the real schema migration, generated database types, all route files, server functions, scouting queries and mutations, database RPC grants, and medical-related search hits; no gaps left in the requested repository scan.
