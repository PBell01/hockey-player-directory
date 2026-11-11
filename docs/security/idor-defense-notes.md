# IDOR defense notes

Source of the risk: `docs/security/attack-surface-map.md` (player URL and scouting pages rows).

## What this closes
A signed-in staff member must not open another player's confidential roster or scouting record by editing the player id or note id in the web address. Signing in proves who they are. It does not grant every record.

## Safe identifiers
`src/server/authorizeResource.ts` accepts an id only when it is a UUID (digits and a-f, with hyphens in the UUID places). The raw web-address text is never glued into a SQL sentence. The lookup passes the checked id as a value to the database client.

Rejected example: `player';select`
Allowed example: `11111111-2222-4333-8444-555555555555`

## Who may see the record
Role names are copied from `docs/security/role-access-matrix.md` and `docs/access/access-matrix-v2.md`. The TypeScript map uses these same strings. The role is read on the server from the signed-in user's own `staff_profiles` row, never from the browser.

- coaching may read player only.
- scouting may read player and scouting_note.
- medical may read player only.
- assistant_scout may read scouting_note only.
- video_analyst may read scouting_note only.

A scouting_note is a row of `scouting_events`. Matrix v2 gives coaching no access to scouting notes, so coaching is denied.

## Object-level check
A matching role is not enough. After the role check, the module reads that one row with the signed-in user's database client, so row-level security already applies. If that read returns no row, access is denied. A failed read is never retried with a more powerful client.

A denied read, a missing record, and a malformed id all produce the same refusal, "Record not found", so the app does not confirm that another player's id is real.

## What this file must never do
- No master database key and no client built with one.
- No new tables and no rewritten row-level security policies. Existing RLS stays the database backstop.
- No role taken from the browser.

## Reviewer walk-through
1. Id `player';select` is rejected before any database query.
2. A valid UUID for a record that row-level security hides from this user returns no row, so it is denied even though the user is signed in.

## Known limits and open questions
- The `players` table still has an open development policy readable by anyone. For players, the object-level check cannot deny anything until that policy is tightened. The role check still applies.
- Neither matrix says whether assistant_scout and video_analyst may read player records, so they are denied by default. Add a row to the matrix and the map here once that is decided.
- The schema has no team column, so there is no team-scope check.
- This module is not wired into any route yet. `src/server/scouting-notes.ts` is unchanged.