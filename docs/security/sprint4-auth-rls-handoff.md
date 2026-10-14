# Sprint 4 Handoff: Auth Sessions and Row-Level Security

**Project:** Hockey operations app (scouting notes & sports-science data)
**Sprint:** Sprint 4 — Identity: Who You Are and What You May Do
**Audience:** Hockey ops leads, product owners, and the next engineer/agent
**Related sources:** `docs/security/hockey-staff-access-brief.md`, `docs/security/role-access-matrix.md`, `docs/security/auth-session-plan.md`, `docs/security/rls-policy-spec.md`, `docs/security/rls-verification-checklist.md`, `supabase/migrations/20250321000000_hockey_staff_rls.sql`

---

## 1. Sprint outcome (client story)

Scouting notes and sports-science rows must not be visible to every staff member. This sprint delivered sign-in with **Supabase Auth**, **session checks inside server functions** (so the browser alone is never trusted), and a **PostgreSQL row-level security (RLS) design** so coaching, scouting, and medical staff would see different rows of shared tables — even if someone called the API directly.

| Original privacy goal (from access brief) | How this sprint addresses it |
| --- | --- |
| Only signed-in staff reach sensitive data | Login/logout + `require-session` on server paths — **delivered** |
| Role decides which rows are visible | RLS policies written from the role access matrix — **delivered as a migration file, not yet exercised against live data (see Residual Risks)** |
| UI hiding is not enough | Policies enforced in Postgres by design; checklist documents how to verify direct access stays blocked — **delivered as design + checklist; live verification partially blocked** |
| Ops can explain who sees what | Role matrix + this handoff in plain language — **delivered** |

---

## 2. What was delivered

### Authentication sessions
- Staff sign-in and sign-out via Supabase Auth (`src/lib/auth/sign-in.ts`, `src/lib/auth/sign-out.ts`, `src/routes/login.tsx`).
- Typed Supabase browser and server clients (`src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`) with env vars documented in `.env.example`.

### Server-side session verification
- `src/lib/auth/require-session.ts` reads the session on the server and fails closed when there is no valid session.
- `src/server/get-current-staff.ts` resolves the signed-in user's identity for authorized paths.
- Protected scouting data loads through an authenticated server path (`src/server/scouting-notes.ts`, `src/routes/scouting/index.tsx`), which calls `require-session` before querying and uses the server (not browser) Supabase client.

### Authorization with RLS (by role) — design complete, live data pending
- Written policy spec: `docs/security/rls-policy-spec.md` (derived from `docs/security/role-access-matrix.md`).
- Migration file: `supabase/migrations/20250321000000_hockey_staff_rls.sql`, which creates a `staff_profiles` table, a `current_staff_role()` helper, and role-scoped policies for coaching, scouting, and medical.
- **Important gap:** this migration's sensitive-table policies target `scouting_notes` and `sports_science_records` — logical names from the planning docs. The application's actual tables are `players`, `games`, and `scouting_events`. The protected scouting server path (`src/server/scouting-notes.ts`) reads from the real `scouting_events` table, but RLS policies have not yet been written or applied against that real table or against `staff_profiles` with real role assignments. See Residual Risks and Next Topic below.

### Verification artifacts
- Automated coverage for the session helper: `src/lib/auth/require-session.test.ts` (authenticated success, no-session failure, and Supabase-error failure — all fail closed).
- Manual/security checklist: `docs/security/rls-verification-checklist.md`, which documents the intended per-role proof process and explicitly marks the rows that are currently blocked pending the schema gap above.

---

## 3. How stakeholders assign coaching, scouting, and medical roles

**Today (this sprint):**
1. Create or invite the staff user in Supabase Auth (email/password).
2. A `staff_profiles` row with a `role` column (`coaching` | `scouting` | `medical`) is defined in the migration, but **no process yet exists to populate it for real staff** — this must be done by hand in the Supabase dashboard until an admin flow is built.
3. Have the user sign in through the app login route so a real session is established.
4. Once `staff_profiles` is populated and RLS policies target the real sensitive tables, confirm role filtering with `docs/security/rls-verification-checklist.md`.

**Not built in this sprint (do not promise to ops yet):**
- Self-serve admin UI for role changes
- Automatic role sync from HR systems
- Multi-role users or temporary "elevated" access
- Row-level security actually enforced against live scouting/medical data (policies exist in a migration file but reference table names not yet present in the database)

**Safe operating rule:** Treat role changes as a privileged ops/engineering action. After any role change, and after the schema gap below is resolved, re-run `docs/security/rls-verification-checklist.md`.

---

## 4. How to run the verification checklist

1. Open `docs/security/rls-verification-checklist.md`.
2. Confirm which rows are marked blocked due to the schema gap (table names referenced by the migration vs. the real schema) before assuming a "pass."
3. Run session helper tests: `npx vitest run src/lib/auth/require-session.test.ts`.
4. For rows that are not blocked (e.g., confirming `scouting-notes.ts` calls `require-session` before querying, and that a signed-out visitor cannot load `/scouting`), walk the checklist and record pass/fail.
5. Once `staff_profiles` is populated and RLS targets real tables, sign in as each role fixture and complete the remaining checklist rows.

If any check fails, **do not** "fix" it by only hiding UI controls — trace session verification and RLS policies first.

---

## 5. Residual risks

| Risk | Why it matters | Mitigation now / next |
| --- | --- | --- |
| RLS migration targets table names (`scouting_notes`, `sports_science_records`) that don't match the real schema (`scouting_events`, and no medical table yet) | Row-level security is not actually protecting live data yet, despite a migration existing | Next topic: reconcile the migration with real table names, or create the planned tables, before relying on RLS in production |
| No process to populate `staff_profiles` | A signed-in user has no role, so policies currently resolve to deny-all for sensitive tables once applied | Next topic: minimal admin flow or documented manual SQL step |
| Wrong role on a staff profile (once populated) | User sees too much or too little data | Dual-check role on assign; re-run checklist |
| Service role or bypass keys misused | RLS can be skipped by privileged clients | Keep service keys server-only; never ship them to the browser |
| New tables without RLS | Fresh data may be wide open | Add RLS to the definition of done for new sensitive tables |
| UI-only "protection" regressions | Buttons can hide data that APIs still return | Prefer server paths + RLS; keep checklist items for direct access |
| Incomplete browser role journeys in CI | Regressions slip to production | Next topic: Playwright role journeys + pipeline gates |

---

## 6. What should roll into the next topic

1. **Reconcile RLS migration with real schema** — either rename/adapt the migration's policies to the actual `scouting_events` table, or formally add `scouting_notes`/`sports_science_records` tables if the product still needs them distinctly. This is the top-priority item before RLS can be called "live."
2. **Admin role assignment** — a controlled way for trusted ops/engineering to set `coaching` / `scouting` / `medical` on `staff_profiles` without raw SQL every time.
3. **Playwright role journeys** — end-to-end scripts that sign in as each role and assert allowed vs. denied scouting/medical views, once real RLS is in place.
4. **CI / Vercel safeguards** — run session unit tests and e2e role checks in CI; ensure preview/production env vars never expose service-role secrets; block deploys on failing security checks when practical.
5. **Expand coverage** — any sports-science/medical data area from the matrix that still has no real table at all.

---

## 7. Decision log (plain language)

1. **Identity is checked on the server**, not only in the browser, so a modified webpage cannot pretend to be signed in.
2. **Authorization for row visibility is designed to live in Postgres RLS**, so coaching, scouting, and medical filters would still apply if someone called the API directly — this design is written and migrated, but not yet pointed at the real tables.
3. **Roles follow the written matrix** (`docs/security/role-access-matrix.md`); policies were specified (`docs/security/rls-policy-spec.md`) before SQL was written, to avoid one-off rules.
4. **Proof beats hope**: tests for `require-session` plus `docs/security/rls-verification-checklist.md` are part of the delivery, and the checklist honestly marks what could not yet be verified rather than claiming a false pass.
5. **Handoff is mandatory** for multi-hour security work so hockey ops and the next sprint share the same accurate story of what's protected today and what still needs the schema gap closed.

---

## 8. Sign-off

- [ ] Privacy goals from the access brief are mapped above (delivered, partially delivered, or deferred)
- [ ] Schema gap between the RLS migration and the real database is understood by the next engineer
- [ ] Role assignment steps match how `staff_profiles` actually works today (manual, no admin UI)
- [ ] Verification checklist path is correct and its blocked rows are understood
- [ ] Residual risks and next-topic items reviewed with stakeholder

**Prepared for:** Hockey operations & product
**Sprint status:** Identity and session-verification slice complete; per-role database enforcement (RLS) designed and migrated but not yet verified against live data — pending schema reconciliation in the next topic.