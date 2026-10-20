# Access Decision Note — Mid-Season Hockey Staff

**For:** Hockey Operations Lead  
**Decision:** Access permissions for the assistant scout and video analyst  
**Date:** October 20, 2026

## The Request

Hockey operations added two positions mid-season: assistant scout and video analyst. Both need access to scouting and game information to perform their jobs. Their access must remain limited to their responsibilities, while medical records, sports-science information, and medical flags stay protected. Existing staff roles and sign-in processes are not being redesigned.

## Who May See What

**Assistant Scout:** May view and add scouting notes and events for players and games. May view game schedules, results, and other permitted game information. This role cannot change existing scouting notes or add or change game data.

**Video Analyst:** May view existing scouting notes for context and view game schedules, results, and in-game events. This role cannot add or change scouting notes or game data.

**Both roles:** Cannot view or change medical records or sports-science information. Medical flags, such as injury status or clearance to play, must also remain hidden, even on shared scouting or game screens.

## Why These Limits Exist

The assistant scout needs to document observations and identify games to scout. The video analyst needs existing scouting information and detailed game events to review footage. Neither job requires access to private health or sports-science information. These restrictions allow staff to complete their work without exposing unrelated sensitive information.

## What the Security Tests Proved

Security testing was completed on October 20, 2026, using test accounts and the project's database. All 16 checks passed, including the final run after strengthening the tests.

- The assistant scout successfully read scouting notes and game information, while attempts to read or change medical and sports-science records were blocked.
- The video analyst successfully read scouting notes and game information, while attempts to read or change medical and sports-science records were blocked.
- Medical staff successfully read medical records, confirming that the restrictions did not block authorized medical access.
- A signed-out visitor was blocked from reading scouting notes.
- Neither new role saw medical flags in shared data. However, no medical-flag field currently exists, so this does not prove that future medical flags will be hidden.

These outcomes are documented in `docs/access/role-action-results.md`.

## Master-Key Protection

The database has a master key that can bypass normal access restrictions. Requests made by signed-in staff must never use this key, including requests from the assistant scout and video analyst.

Only explicitly approved server-only jobs may use it. Currently, **no jobs are approved** to use the master key. Staff requests must continue using their normal access restrictions.

## Remaining Risks and Future Changes

Two risks still require attention:

- The `players` table remains accessible without signing in because of an existing development access rule. Its free-text notes could expose information that has not been separately reviewed. A future decision must address this.
- Medical flags and shared views do not yet exist in the database. If introduced later, they must be explicitly protected and tested so unauthorized staff cannot see them.

Future development must not reopen medical or sports-science access, including medical flags, without a new written access decision. Any new permissions must be reviewed before implementation.

## Sources

- `docs/access/new-roles-brief.md`
- `docs/access/access-matrix-v2.md`
- `docs/access/service-role-key-rule.md`
- `docs/access/role-action-results.md`