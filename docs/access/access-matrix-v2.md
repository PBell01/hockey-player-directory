# Access matrix v2

## Purpose
This file is the contract for a later database change. It is not that change. It contains no SQL and it does not create a migration.

## Sources
- docs/access/new-roles-brief.md
- docs/access/overgrant-audit.md
- docs/access/service-role-key-rule.md

## How to read a cell
- Deny means the role cannot see or change that data.
- See means look only. It does not include add, change, or delete.
- Never means this role must not use the service-role key.
- A cell that is not a needed allow is Deny.

## Roles
- Assistant scout: supports the scouting team by recording and reviewing scouting observations under a scout's direction (from the brief).
- Video analyst: reviews game footage and in-game events to support coaching and scouting preparation (from the brief).
- Coaching: unchanged job from the earlier matrix (role-access-matrix.md) — plans practices and games.
- Scouting: unchanged job from the earlier matrix — records and reviews player evaluations and competitive intelligence.
- Medical: unchanged job from the earlier matrix — tracks sports-science and medical-related information for player care.

## Data areas
- Scouting notes: written opinions and reports about players as hockey prospects, not health records.
- Game data: scores, schedules, and game or video notes that are not medical.
- Medical records: injury and health records.
- Sports-science data: body measurements, training load, and injury-risk numbers.
- Medical flags in shared scouting views: short markers, such as injured or not cleared, that can show on a scouting screen even when the medical record is hidden.

## Matrix

| Role | Data area | Action | Because |
| --- | --- | --- | --- |
| Assistant scout | Scouting notes | See, Add | The brief says the assistant scout views and logs scouting notes/events for players and games. |
| Assistant scout | Game data | See | The brief says the assistant scout views game schedules and results to know which games to scout. No write duty is named. |
| Assistant scout | Medical records | Deny | This job must not see medical data. |
| Assistant scout | Sports-science data | Deny | This job must not see sports-science data. |
| Assistant scout | Medical flags in shared scouting views | Deny | A flag on a scouting screen is still medical information. |
| Assistant scout | Service-role key | Never | Staff screens use the signed-in person. Allowed server jobs stay in docs/access/service-role-key-rule.md, which lists none. |
| Video analyst | Scouting notes | See | The brief says the video analyst views existing scouting notes for context, but does not create or edit them. |
| Video analyst | Game data | See | The brief says the video analyst views game schedules, results, and in-game events in detail as their primary working data. No write duty is named. |
| Video analyst | Medical records | Deny | This job must not see medical data. |
| Video analyst | Sports-science data | Deny | Performance on video is not sports-science data. |
| Video analyst | Medical flags in shared scouting views | Deny | A flag on a scouting screen is still medical information. |
| Video analyst | Service-role key | Never | Staff screens use the signed-in person. Allowed server jobs stay in docs/access/service-role-key-rule.md, which lists none. |
| Coaching | Scouting notes | Deny | Unchanged from the earlier matrix. Per role-access-matrix.md, coaching has no allow on scouting_notes content. |
| Coaching | Game data | See, Add | Unchanged from the earlier matrix. Coaching owns practice/game plans per role-access-matrix.md. |
| Coaching | Medical records | Deny | Unchanged from the earlier matrix. No new medical allow. |
| Coaching | Sports-science data | Deny | Unchanged from the earlier matrix. No new sports-science allow. |
| Coaching | Medical flags in shared scouting views | Deny | Unchanged from the earlier matrix. No new flag allow. |
| Coaching | Service-role key | Never | Staff screens use the signed-in person. |
| Scouting | Scouting notes | See, Add, Change | Unchanged from the earlier matrix. Scouting records and reviews their own notes per role-access-matrix.md. |
| Scouting | Game data | See | Unchanged from the earlier matrix. |
| Scouting | Medical records | Deny | Unchanged from the earlier matrix. No new medical allow. |
| Scouting | Sports-science data | Deny | Unchanged from the earlier matrix. No new sports-science allow. |
| Scouting | Medical flags in shared scouting views | Deny | Shared scouting views must hide medical flags from scouts, same as the earlier matrix intended; stated explicitly here so it cannot be read as a new job duty. |
| Scouting | Service-role key | Never | Staff screens use the signed-in person. |
| Medical | Medical records | See, Add, Change | Unchanged from the earlier matrix. Medical tracks sports-science/medical data for player care, within their authorized care scope. |
| Medical | Sports-science data | See, Add, Change | Unchanged from the earlier matrix. Same reasoning as medical records. |
| Medical | Medical flags in shared scouting views | Deny | Unchanged from the earlier matrix. Medical staff access medical records directly; they do not need a flag surfaced on a scouting-specific shared view, which is scouting/game content outside their primary workflow. |
| Medical | Service-role key | Never | Even medical screens use the signed-in person, not the master key. |

No additional tables, columns, or server functions were named as too-open in docs/access/overgrant-audit.md beyond the missing-RLS finding already covered under "Narrowed from the audit" below, which applies at the table level across roles rather than as a per-role cell.

## Shared scouting views
A shared scouting view is a screen or saved query that mixes scouting or game information for people who are not in the medical role. Medical flags must be left out of every shared scouting view that the assistant scout, the video analyst, or the scouting role can open. Hiding the medical table is not enough if the flag still shows on that screen. No medical flag field currently exists in the schema, so there is nothing to hide today — this rule governs any such field added later.

## Service-role key
No staff role may use the service-role key. The only jobs that may use it are the ones already written in docs/access/service-role-key-rule.md, which currently lists none. This file does not add new jobs to that list.

## Narrowed from the audit
- docs/access/overgrant-audit.md found that `players`, `games`, and `scouting_events` have no row-level security applied, so any signed-in (or possibly anonymous) caller with the anon key can currently read and write all three tables regardless of role. This matrix's Deny cells above (e.g., coaching denied on scouting notes, all roles denied on medical/sports-science data) represent the target state this over-grant must be narrowed to. The actual database change that enforces these cells is the next step's migration, not this file.
- docs/access/overgrant-audit.md found that /scouting has no role check, only a login check — any signed-in user can currently call listScoutingNotes regardless of role. The Deny cell for Coaching / Scouting notes above is the target this must be narrowed to.

## Existing roles
Coaching, scouting, and medical stay as they were, except where the audit required a narrower cell (see Narrowed from the audit above). This file does not give coaching or scouting a new allow on medical records, sports-science data, or medical flags.

## Not in this file
No SQL. No file under supabase/migrations/. No staff email. No test list.