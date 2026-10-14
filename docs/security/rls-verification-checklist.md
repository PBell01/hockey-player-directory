# RLS Verification Checklist

This checklist is for a beginner tester verifying the staff access rules described in `docs/security/rls-policy-spec.md`.

## Important Current-State Notes

- The `/scouting` page is backed by `src/server/scouting-notes.ts`.
- The real table queried by that server function is `scouting_events`, not the placeholder logical table name `scouting_notes` used in earlier planning documents.
- The migration `supabase/migrations/20250321000000_hockey_staff_rls.sql` targets the logical tables `scouting_notes`, `sports_science_records`, and `staff_profiles`. Those tables do not yet contain the project's real live data schema, so role-based RLS cannot be fully exercised end-to-end right now.
- Mark the role-policy rows below **Blocked: see Open Questions in rls-policy-spec.md**. Do not mark them Pass or Fail until the real schema mapping, role assignment, and open policy questions are resolved.
- UI hiding is not sufficient. A denial must hold at the server/API path and in Postgres RLS, not only because a page or button is hidden in the browser.

## How To Record Results

For each test, use a separate browser session or account for the stated identity. Record the exact account, time, and result. Do not use a service-role key for these checks because it bypasses RLS.

## Signed-Out User

### Action

1. Sign out of the application, or open a private browser window with no Supabase session.
2. Navigate directly to `/scouting`.
3. If possible, also inspect the server/API request and attempt the underlying read without an authenticated session.

### Expected result

**Pass:** The page shows `Please sign in to view scouting events.` The server request does not return scouting rows. The server/API path rejects the unauthenticated request.

**Fail:** Any scouting event data is returned, or access is granted because the page merely hides a link while a direct server/API request still returns data.

### Status

- [ ] Pass
- [ ] Fail
- [ ] Notes: ______________________________________________

## Coaching Staff

### Action

1. Sign in as a user whose `staff_profiles.role` is `coaching`.
2. Navigate directly to `/scouting`.
3. Try to read scouting data through the server/API path as that same user; do not rely only on whether a navigation link is visible.
4. For the policy-level test, attempt SELECT, INSERT, UPDATE, and DELETE against the real table mapped to the logical `scouting_notes` data area.

### Expected result

**Pass according to the policy spec:** Coaching cannot SELECT, INSERT, UPDATE, or DELETE scouting-note rows. It also cannot SELECT, INSERT, UPDATE, or DELETE `sports_science_records` rows. Any allowed shared directory fields are a separate `player_roster_shared_fields` concern.

**Fail:** Coaching can see scouting-note or sports-science rows, create or change them, delete them, or access them through a direct server/API request even if the UI hides the page.

### Status

- [ ] **Blocked: see Open Questions in rls-policy-spec.md**
- [ ] Notes: ______________________________________________

## Scouting Staff

### Action

1. Sign in as a user whose `staff_profiles.role` is `scouting`.
2. Navigate directly to `/scouting`.
3. Confirm that the returned list contains only rows the server receives for this authenticated session; do not add an application-side role filter.
4. For the policy-level test, attempt SELECT, INSERT, UPDATE, and DELETE against the real table mapped to the logical `scouting_notes` data area. Also attempt SELECT, INSERT, UPDATE, and DELETE against the real table mapped to `sports_science_records`.

### Expected result

**Pass according to the policy spec:** Scouting may SELECT, INSERT, and UPDATE scouting-note rows. UPDATE must not allow changing ownership or role to bypass the policy. Scouting may not DELETE scouting-note rows until the delete question is resolved. Scouting cannot SELECT, INSERT, UPDATE, or DELETE sports-science rows.

**Fail:** Scouting is falsely denied from allowed scouting-note reads or writes, can delete scouting-note rows, can change ownership to bypass RLS, or can access sports-science rows. A direct server/API response that contains rows denied by Postgres is also a fail.

### Status

- [ ] **Blocked: see Open Questions in rls-policy-spec.md**
- [ ] Notes: ______________________________________________

## Medical Staff

### Action

1. Sign in as a user whose `staff_profiles.role` is `medical`.
2. Navigate directly to `/scouting`.
3. For the policy-level test, attempt SELECT, INSERT, and UPDATE against the real table mapped to `sports_science_records`, and attempt DELETE until the open question is resolved.
4. Also attempt SELECT, INSERT, UPDATE, and DELETE against the real table mapped to `scouting_notes`.

### Expected result

**Pass according to the policy spec:** Medical may SELECT, INSERT, and UPDATE sports-science rows, subject to the eventual caseload decision. Medical may not DELETE those rows until the delete question is resolved. Medical cannot SELECT, INSERT, UPDATE, or DELETE scouting-note rows.

**Fail:** Medical is falsely denied from allowed sports-science operations, can delete sports-science rows before deletion is approved, can access scouting-note rows, or can access data through a direct server/API request that the RLS policy should deny.

### Status

- [ ] **Blocked: see Open Questions in rls-policy-spec.md**
- [ ] Notes: ______________________________________________

## Server Authentication Check

This check can be verified today and is not blocked by the unresolved database mapping.

### Action

1. Open `src/server/scouting-notes.ts`.
2. Inspect the handler exported as `listScoutingNotes`.
3. Confirm that `await requireSession()` is the first statement inside the handler.
4. Confirm that the Supabase query appears only after that call and queries `scouting_events`.
5. With no session, call `/scouting` and confirm the page shows the sign-in message instead of crashing.

### Expected result

**Pass:** Session validation occurs before creating the authenticated server client or querying `scouting_events`. A signed-out request is rejected before any data query, and the route displays `Please sign in to view scouting events.`

**Fail:** The code queries Supabase before `requireSession()`, accepts a caller-provided role or user ID, uses a browser client for this read, or exposes event data to a signed-out request.

### Status

- [ ] Pass
- [ ] Fail
- [ ] Notes: ______________________________________________

## Sign-Off

Tester name: ______________________________________________

Date: ____________________

Overall result: [ ] Pass  [ ] Fail  [ ] Partial

Notes and follow-up blockers:

__________________________________________________________________

__________________________________________________________________
