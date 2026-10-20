# Migration review checklist

This file is the sign-off for the least-privilege migration. It contains no secret keys, passwords, or connection strings.

## Sources reviewed

- Migration: supabase/migrations/20260418120000_least_privilege_new_staff_roles.sql
- Access matrix: docs/access/access-matrix-v2.md
- Service-role key rule: docs/access/service-role-key-rule.md
- Reviewer (your name): PBell01
- Date: 2026-10-20

## How to mark a result

- pass: compared to the matrix or key rule, and the migration matches.
- fail: does not match. No sign-off while any item is fail.
- residual risk: could not be fixed inside this migration file. Reason written below.

## Checks

### 1. Default deny

- Result: pass
- Plain-language evidence: The migration enables row-level security on games and scouting_events and writes only narrow allow policies, each gated by one named role. There is no catch-all policy.
- What happens if no allow-rule matches: The request is refused. Coaching has no policy on scouting_events, and medical has no policy on either table, so both get zero rows and zero writes. A signed-in user with no staff profile has no role, so they match nothing.

### 2. Every policy maps to a matrix cell

| Policy or grant | Hockey role | Action | Matrix v2 says | Result |
| --- | --- | --- | --- | --- |
| scouting_events_select_assistant_scout | Assistant scout | See scouting notes | See, Add: allow | pass |
| scouting_events_insert_assistant_scout | Assistant scout | Add scouting notes | See, Add: allow | pass |
| scouting_events_select_video_analyst | Video analyst | See scouting notes | See: allow | pass |
| scouting_events_select_scouting | Scouting | See scouting notes | See, Add, Change: allow | pass |
| scouting_events_insert_scouting | Scouting | Add scouting notes | See, Add, Change: allow | pass |
| scouting_events_update_scouting | Scouting | Change scouting notes | See, Add, Change: allow | pass |
| games_select_assistant_scout | Assistant scout | See game data | See: allow | pass |
| games_select_video_analyst | Video analyst | See game data | See: allow | pass |
| games_select_coaching | Coaching | See game data | See, Add: allow | pass |
| games_insert_coaching | Coaching | Add game data | See, Add: allow | pass |
| games_select_scouting | Scouting | See game data | See: allow | pass |
| (no policy) | Coaching | Scouting notes | Deny | pass |
| (no policy) | Video analyst | Add or change scouting notes | Not allowed (See only) | pass |

- Any rule you could not tie to a cell: none. Coaching "Add" on game data covers insert only. Matrix v2 also lists no Change for any game-data role, and none was written.

### 3. Nothing is open to everyone

- Result: pass
- What you found: no hits for PUBLIC or anon. "authenticated" appears on every policy, but each one is also limited to a single named role through current_staff_role(), so it is not a blanket allow for all signed-in users. The word "public" appears only in schema names such as public.games.
- Does any hit expose medical data, sports-science data, or a medical flag? No. This migration touches only games, scouting_events, and staff_profiles.

### 4. Assistant scout: medical data sealed

- Result: pass
- Plain-language evidence: No policy or grant in this migration gives assistant_scout access to any medical table. No medical table exists in the real schema, so there is nothing to read. See Residual risks.

### 5. Assistant scout: sports-science data sealed

- Result: pass
- Plain-language evidence: Same as check 4. assistant_scout is allowed only on scouting_events and games.

### 6. Assistant scout: medical flags hidden in shared views

- Result: pass
- Which shared view you checked: none. The migration creates and alters no views, and the audit found no existing view.
- Does that view run with the caller's rights (security_invoker) or with its owner's rights: not applicable. There is no view.
- Plain-language evidence: No medical-flag column exists on games or scouting_events. A rule is needed if one is added later. See Residual risks.

### 7. Video analyst: medical data sealed

- Result: pass
- Plain-language evidence: video_analyst has policies only on scouting_events (see) and games (see). No medical table is referenced.

### 8. Video analyst: sports-science data sealed

- Result: pass
- Plain-language evidence: Same as check 7, checked separately for this role. No sports-science table or column is referenced.

### 9. Video analyst: medical flags hidden in shared views

- Result: pass
- Which shared view you checked: none. No views are created or altered.
- Does that view run with the caller's rights (security_invoker) or with its owner's rights: not applicable.
- Plain-language evidence: No view and no flag column exist. The video analyst can only see rows and columns in games and scouting_events.

### 10. Staff-facing requests do not use the service-role key to bypass seals

- Result: pass
- Compared to which sentence in the service-role key rule: "If a job is not named on the allowed list below, it must not use this key," and the allowed list is none.
- Plain-language evidence (no secret values): This migration never mentions the service-role key and grants no bypass. It has no SECURITY DEFINER function. The only one in the project is current_staff_role() in the earlier migration, and it returns only a role label, not rows.
- SECURITY DEFINER function that returns sealed data, if any: none.

## Fixes sent back to the agent

| Failed check | What you saw | What you asked the agent to change | Re-checked result |
| --- | --- | --- | --- |
| none | No check failed | none | not applicable |

## Residual risks

| Check | What is still open | Why it was not fixed in this migration |
| --- | --- | --- |
| 1, 3 | The players table has no row-level security (and players.notes is free text), so anyone holding the public anon key can still read and write it. | Turning RLS on would break the player directory pages. The matrix has no players row, so this needs its own decision in a later step. |
| 4-9 | No medical or sports-science table, medical-flag column, or shared view exists, so the sealed checks pass only because nothing sealed exists yet to test. | There is nothing to protect yet. Any future medical table, flag column, or shared view must get its own policy and a security_invoker view before it ships. |
| 1, 2 | The migration has not been applied. It depends on staff_profiles and current_staff_role() from 20250321000000_hockey_staff_rls.sql, which references tables that do not exist (scouting_notes, sports_science_records). | That earlier file must be reconciled first. Applying to production is out of scope for this step. |
| 2 | The role check constraint name (staff_profiles_role_check) is assumed from the default Postgres naming. | It can only be confirmed against the real database when the migration is applied. |

## Sign-off

- Every required check is pass or residual risk: yes
- I did not create a second migration file: yes
- Sentence I could say to hockey operations about the two new roles and sealed medical data: The assistant scout can read and add scouting events and read games. The video analyst can only read scouting events and games. Neither can see medical or sports-science data, and the database refuses anything not explicitly allowed. The player directory and the not-yet-applied migration are noted as open risks.