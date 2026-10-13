# Auth Session Plan — Hockey Staff (Sprint 4)

## Purpose
Describe how staff prove who they are with Supabase Auth, where the session lives,
and how TanStack Start server functions must re-check identity before any
sensitive query. Role *what they may see* comes from `docs/security/role-access-matrix.md`;
this plan covers *how we know who is asking*.

## Roles in scope (from the matrix)
- coaching
- scouting
- medical

(No extra roles are introduced here. See the role matrix for row-level rules.)

## End-to-end sequence
1. **Login** — Staff open a login route and sign in with Supabase Auth. On success, Supabase establishes a session.
2. **Session storage** — The session is kept so the browser can send it on later requests, via cookies managed by the Supabase SSR/auth helpers, not a token pasted into frontend code.
3. **Server verify** — Before reading private data, TanStack Start **server functions** create a **server Supabase client**, read the current session, and run a **require-session** style check. If there is no valid session, the function stops (fail closed) and does not query scouting or medical tables.
4. **Data access** — Only after a valid session may the server function query data. Per-role row filtering will be enforced later with Postgres **RLS**, using the signed-in user's identity/role; the UI must not be the only gate.

```text
Staff browser          TanStack Start            Supabase Auth / DB
     |                      |                            |
     |-- sign in ---------->|--- auth API -------------->|
     |<-- session cookie ---|<-- session established ----|
     |                      |                            |
     |-- load scouting ---->| server function            |
     |                      |-- require-session -------->|
     |                      |-- query (if OK) ---------->|
     |<-- filtered rows ----|<-- rows (RLS later) -------|
```

## Browser Supabase client vs server Supabase client
| Client | Where it runs | Used for |
|--------|---------------|----------|
| Browser client | User's browser (login UI, sign-out control) | Starting sign-in / sign-out; must not be trusted alone for authorization |
| Server client | TanStack Start server functions | Reading the session from the request/cookies; running queries only after require-session |

## Session rules (non-negotiable)
- React state or a hidden menu is never treated as proof of identity on the server.
- Every sensitive server function checks the session again, independently of the browser.
- Missing or expired session → deny access; no partial private rows are returned.
- Role names used later (coaching / scouting / medical) must match `docs/security/role-access-matrix.md`.

## Server functions that must call require-session (planned)
| Server entry (planned name) | Why |
|-----------------------------|-----|
| `get-current-staff` (or equivalent) | Resolves who is signed in and their staff role before the UI shows role-specific chrome |
| Scouting notes loader (server path) | Returns scouting rows only after identity is verified; RLS will further filter rows per the matrix |
| Medical / sports-science loader (server path) | Same pattern — session first, then query; medical rows stay restricted per the matrix |
| Practice/game plan loader (server path) | Same pattern — session first, then query, scoped to coaching per the matrix |

Sign-in and sign-out helpers establish or clear the session; they are not data loaders, but they must use the browser client, not the server client.

## What this plan deliberately defers
- Typed client file layout (`src/lib/supabase/...` for auth) — next implementation step
- Login route UI and sign-in/sign-out modules
- The actual `require-session` helper code
- Postgres RLS policy SQL (a later step, once this plan and the matrix are approved)

## Acceptance checks for later agent work
- [ ] Browser and server clients are separate and used in the right place
- [ ] Login creates a real Supabase Auth session (not fake local-only auth)
- [ ] Sensitive server functions call require-session before queries
- [ ] Unauthenticated calls fail closed
- [ ] Role matrix remains the source of truth for who may see which rows

## Source links
- Role matrix: `docs/security/role-access-matrix.md`
- Access brief: `docs/security/hockey-staff-access-brief.md`