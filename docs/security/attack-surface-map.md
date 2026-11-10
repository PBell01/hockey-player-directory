# Attack surface map — hockey operations roster tool

## Purpose
This map lists doors a hostile review can use before any new defense code is written.
Confidential data in scope: roster decisions, injuries, trade thoughts, and scout notes.

## Actors
Role names are copied from the role matrix and access matrix v2. No other role is introduced.

| Actor | What they are | Evidence path |
| --- | --- | --- |
| coaching | Signed-in staff role | docs/security/role-access-matrix.md |
| scouting | Signed-in staff role | docs/security/role-access-matrix.md |
| medical | Signed-in staff role | docs/security/role-access-matrix.md |
| assistant scout | Signed-in staff role added mid-season | docs/access/access-matrix-v2.md |
| video analyst | Signed-in staff role added mid-season | docs/access/access-matrix-v2.md |
| Third-party hockey data provider | Outside sender that posts game events | openapi/hockey-ingestion.yaml |
| Coach (evaluation form) | Staff member who submits evaluations. The contract does not yet say how they are identified. | openapi/hockey-ingestion.yaml |

Staff access context: docs/security/hockey-staff-access-brief.md says scouting notes and sports-science data must stay limited by role, even when someone bypasses the screens.

## Entry points

| Entry point | File path or URL shape | Actor who can reach it | Reads or changes | Hole to review | Why this hole fits this file | Evidence path |
| --- | --- | --- | --- | --- | --- | --- |
| Player URL | src/routes/players/$playerId.tsx, address shape /players/{id} | Anyone who can open the site. No session check was added to this page in Sprint 4. | Reads | IDOR | The id in the address selects the player record. Changing the id opens a different player, and the page has no role check of its own. The players table is readable by anon and authenticated through a leftover development policy, so the database does not stop it either. | docs/security/rls-policy-spec.md |
| Scouting pages | src/routes/scouting/index.tsx (server function with a session check) and src/routes/scouting/events.tsx, players.tsx, aggregates.tsx (browser-client hooks) | Signed-in staff for index.tsx. The other three pages have no session check, so the database policies are the only limit. | Reads (index.tsx). The events page may also log events through the mutation helpers. | XSS; IDOR | XSS: scout-written `notes` text is displayed on these pages. React escapes it by default, so it becomes a risk only if a page renders it as raw HTML. IDOR: the player and game ids in filters and list rows select records, and the three browser-client pages rely only on row-level security to limit them. | docs/security/rls-policy-spec.md |
| Login | src/routes/login.tsx | Anyone | Starts or ends a sign-in session. It does not change roster rows. | none of these four | The page only exchanges an email and password for a session. The session still matters because every protected read and any future signed-in write depends on it. A stolen session or a forced sign-in would give an attacker that user's access. | docs/security/hockey-staff-access-brief.md |
| Events ingestion | src/routes/api/events.ts | Any sender who knows the address. The route has no sender identity check yet. | Changes. It stores one row per provider event id. | injection; CSRF | Injection: the provider's fields are stored. They are validated, then written through the database client as data, not built into a command, but they are outside input and the route uses the service-role key. CSRF: the route does not read session cookies today, so a forged browser request gains nothing extra. It becomes a fit once sign-in is added to this route. | openapi/hockey-ingestion.yaml |
| Evaluations ingestion | src/routes/api/evaluations.ts | Any sender who knows the address. No identity check yet. | Changes in the contract, but the route currently stores nothing and returns a stand-in response. | injection; CSRF | Injection: coach comments and ratings are outside input that will be stored once persistence exists. CSRF: coaches will be signed-in browsers once identity is added, so a forged request could submit an evaluation as them. Today there is no session on the route. | openapi/hockey-ingestion.yaml |

## How a hole was chosen
- IDOR on the player URL: the id in the address selects the record. Evidence: docs/security/rls-policy-spec.md says rows must be limited by role, and the players table currently has no such limit.
- IDOR on the scouting pages: ids in filters and rows select records. Evidence: docs/security/rls-policy-spec.md, since those pages depend on the database rules alone.
- XSS on the scouting pages: scout-written notes are shown on a page. Evidence: docs/security/hockey-staff-access-brief.md names scouting notes as confidential staff-written text.
- Injection on both ingestion routes: outside fields arrive in a request body. Evidence: openapi/hockey-ingestion.yaml lists the fields and their types.
- CSRF on both ingestion routes: only conditional. It applies once the routes are tied to a signed-in browser session. Evidence: docs/security/hockey-staff-access-brief.md requires session checks for protected paths.

## Evidence log
- docs/security/hockey-staff-access-brief.md — used for: which data is confidential, and the rule that session checks and database rules must back every protected path
- docs/security/role-access-matrix.md — used for: the coaching, scouting, and medical role names
- docs/access/access-matrix-v2.md — used for: the assistant scout and video analyst role names
- docs/security/rls-policy-spec.md — used for: who may read which rows
- openapi/hockey-ingestion.yaml — used for: the ingestion fields, the stored-data behavior, and the outside sender

## Out of scope for this map
- No security-header values.
- No CSRF or IDOR implementation code.
- No dependency or package review.
- No new routing, service, or data-access layers.
Those decisions come in later steps. This file is the inventory only.