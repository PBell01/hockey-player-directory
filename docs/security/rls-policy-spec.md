# RLS Policy Specification — Hockey Staff Data

## Purpose
Turn the role access matrix into implementable Postgres row-level security intents.
Coaching, scouting, and medical staff share tables but must see different rows.
This document is the source of truth for the SQL migration in the next step.
This is plain-language policy intent, not finished SQL.

## Identity linkage (must match auth-session-plan)
- Auth source: Supabase Auth session (`auth.uid()` in Postgres).
- Staff mapping: `staff_profiles` table, with a row per staff member where `user_id = auth.uid()`.
- Role field: `staff_profiles.role`, one of `coaching` | `scouting` | `medical`.
- Policies resolve the current user's role by looking up the `staff_profiles` row for `auth.uid()`.
- Unauthenticated users: no row access (RLS enabled; no public/anon policies on these tables).

**Note:** Neither `docs/security/role-access-matrix.md` nor `docs/security/auth-session-plan.md` finalized how role assignment works — both list it as an open question. This spec assumes a `staff_profiles` table as the simplest standard pattern. This assumption must be confirmed before Step 10 writes SQL (see Open Questions).

## Tables in scope
| Logical data area | Sensitivity | Shared across roles? | Notes |
| --- | --- | --- | --- |
| `scouting_notes` | High — competitive intel | Yes — filtered by role | Matches "scouting_notes" in the role matrix. Real table name in this project may differ (see Open Questions). |
| `sports_science_records` | High — medical/performance | Yes — filtered by role | Matches "medical_or_sports_science_data" in the role matrix. No such table exists in the schema yet. |
| `player_roster_shared_fields` | Low — directory only | Yes — all roles, name/position only | Matches the matrix row of the same name. Private note/measure fields on the same underlying table must stay excluded. |

## Policy intents by table

### Table: `scouting_notes`
RLS: ENABLED (required)

#### SELECT
| Role | Allow? | USING intent (plain language) |
| --- | --- | --- |
| scouting | Yes | Row is visible when the current user's `staff_profiles.role` is `scouting`. Per the matrix, this is team-wide, not limited to notes the user personally authored, unless Open Question 2 below resolves otherwise. |
| coaching | No | Per the matrix, coaching must not see scouting-note rows. No USING clause grants access. |
| medical | No | Per the matrix, medical must not see scouting-note rows. |

#### INSERT
| Role | Allow? | WITH CHECK intent |
| --- | --- | --- |
| scouting | Yes | New row's role/owner field must resolve to `scouting`, and the row's author field (if present) must equal `auth.uid()`. |
| coaching | No | Deny all inserts. |
| medical | No | Deny all inserts. |

#### UPDATE
| Role | Allow? | USING + WITH CHECK intent |
| --- | --- | --- |
| scouting | Yes | May update only rows already visible to scouting (USING matches SELECT). WITH CHECK must prevent changing a row's owning role to bypass the policy. |
| coaching | No | Deny. |
| medical | No | Deny. |

#### DELETE
| Role | Allow? | USING intent |
| --- | --- | --- |
| scouting | Per Open Question 3 | The matrix does not state a delete rule explicitly. Default to deny until confirmed. |
| coaching | No | Deny. |
| medical | No | Deny. |

### Table: `sports_science_records`
RLS: ENABLED (required)

#### SELECT
| Role | Allow? | USING intent |
| --- | --- | --- |
| medical | Yes | Row visible when `staff_profiles.role` is `medical`, scoped to the medical staff member's caseload if Open Question 4 below confirms caseload-based access; otherwise all medical rows. |
| coaching | No | Per the matrix, coaching must not see raw medical/sports-science rows. |
| scouting | No | Per the matrix, scouting must not see medical/sports-science rows. |

#### INSERT / UPDATE / DELETE
| Role | INSERT | UPDATE | DELETE | Intent summary |
| --- | --- | --- | --- | --- |
| medical | Yes | Yes | Per Open Question 3 | Writes allowed only when `staff_profiles.role = 'medical'`; WITH CHECK enforces the same role/owner consistency as SELECT. |
| coaching | No | No | No | Deny all writes. |
| scouting | No | No | No | Deny all writes. |

### Table: `player_roster_shared_fields`
RLS: ENABLED (required)

#### SELECT
| Role | Allow? | USING intent |
| --- | --- | --- |
| coaching | Yes | May read shared directory fields (name, position, and similar navigation fields) for all players. |
| scouting | Yes | Same as coaching. |
| medical | Yes | Same as coaching. |

Directory fields are a limited field set, not full row access — per the matrix, this does not grant access to notes or measures tied to that player. If this maps to columns on the same physical `players` table rather than a separate table, the policy must be expressed as column-level restriction (a view or explicit column grants), not row-level filtering alone.

#### INSERT / UPDATE / DELETE
Out of scope for this spec — directory field writes are not covered by the current matrix and should be treated as deny until a future matrix update addresses them.

## Cross-cutting rules
1. Same tables, different rows: policies enforce filters in Postgres; UI hiding is never the only protection, per the access brief.
2. Default deny: if a role/operation is not explicitly listed as allow above, the migration must not add a permissive policy for it.
3. Session agreement: the `staff_profiles` table and `role` field name used here must be the same ones `docs/security/auth-session-plan.md` and the require-session helper rely on, once that plan is updated to match.
4. Service role / bypass: server paths used by the app (queries.ts, mutations.ts, rpc.ts) must run as the signed-in user so RLS applies — not with a service-role key that bypasses RLS — unless a future sprint explicitly designs an admin path.
5. Open questions below must be resolved with stakeholders before SQL is written; this spec must not invent answers to them.

## Traceability
| Matrix row | Table | Policies covered |
| --- | --- | --- |
| scouting_notes | `scouting_notes` | SELECT/INSERT/UPDATE (scouting only); DELETE pending |
| medical_or_sports_science_data | `sports_science_records` | SELECT/INSERT/UPDATE (medical only); DELETE pending |
| player_roster_shared_fields | `player_roster_shared_fields` | SELECT (all three roles); writes out of scope |
| practice_or_game_plans | *(not covered in this spec)* | Deferred — see Open Questions |

## Open questions
1. **Role assignment table:** Does `staff_profiles` (or an equivalent) already exist or is it planned? This spec assumes it does not yet exist and will need its own migration before RLS policies can reference it.
2. **Scouting note ownership:** Is `scouting_notes` access team-wide for all scouting staff, or limited to notes a scout personally authored? The matrix says "for their authorized assignments" but does not define assignment.
3. **Delete permissions:** Neither the matrix nor the brief states whether scouting or medical staff may delete rows. Default is deny until a stakeholder confirms otherwise.
4. **Medical caseload scope:** Is medical access all sports-science rows, or limited to an assigned caseload? Carried over from the role matrix's own open question.
5. **Real schema mapping:** This project's actual tables are `players`, `games`, and `scouting_events` (not `scouting_notes`), and no sports-science/medical table exists yet. Before Step 10 writes SQL, confirm which real tables and columns these logical names map to, or whether new tables/migrations are needed first.
6. **Practice/game plans:** Not covered in this spec because the matrix left its row scope undefined. Add a table section here once that's resolved.

## Ready for migration when
- [ ] Every sensitive matrix data area maps to a table section above
- [ ] Every role has explicit allow or deny for SELECT/INSERT/UPDATE/DELETE
- [ ] Identity linkage matches the auth session plan
- [ ] "Same tables, different rows" is stated for scouting and sports-science data
- [ ] Open questions above are resolved with stakeholders
- [ ] No unfinished SQL required to understand the rules