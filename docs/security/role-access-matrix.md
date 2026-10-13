# Role Access Matrix — Hockey Staff (Sprint 4)

Source brief: `docs/security/hockey-staff-access-brief.md`
Purpose: Contract for app session checks and later Postgres RLS.
Roles (columns): coaching | scouting | medical

## How to read this matrix

- **R** = may read matching rows
- **W** = may create/update matching rows
- **—** = deny (no read, no write)
- **Row scope** explains *which* rows, not only the table name.

## Matrix

| Data kind (logical) | Coaching | Scouting | Medical | Notes / row scope |
| --- | --- | --- | --- | --- |
| player_roster_shared_fields | R | R | R | Shared directory fields only (name, and similar navigation fields). Does not grant access to notes or measures tied to that player. |
| scouting_notes | — | R+W | — | Scouting staff only, for their authorized assignments. The brief does not grant coaching any view into scouting note content, so this is deny, not "limited read." |
| medical_or_sports_science_data | — | — | R+W | Medical staff only, within their authorized care scope. The brief does not state a caseload restriction explicitly — see Open Questions. |
| practice_or_game_plans | R+W | — | — | Coaching-related operational information, per the brief. Exact row-scope (team-wide vs. coach-specific) is not detailed in the brief — see Open Questions. |

## Role summaries

### Coaching
- Primary need: plan practices, prepare for games, manage coaching operations.
- May see: coaching-related operational information; shared directory fields.
- Must not see: scouting notes; sports-science/medical rows.

### Scouting
- Primary need: record and review player evaluations and competitive intelligence.
- May see: scouting notes for their authorized assignments; shared directory fields.
- Must not see: sports-science/medical rows; other roles' private information.

### Medical
- Primary need: track and review sports-science/medical data for player care.
- May see: sports-science/medical rows within their authorized care scope; shared directory fields.
- Must not see: scouting notes; coaching-only information.

## Deny-by-default

If a role/data pair is not explicitly allowed above, treat it as **deny**. Per the brief, access must be denied by default when identity or authorization cannot be verified, and UI hiding is not sufficient — these rules must hold for direct API or database access as well.

## Open questions (resolve before RLS migration)

1. **Role assignment:** How is a signed-in staff member mapped to coaching / scouting / medical (profile column, auth claim, invite table)? (Also listed as an open question in the access brief.)
2. **Row ownership keys:** What column ties a scouting note or medical row to the staff member or athlete (`author_id`, `athlete_id`, `caseload_staff_id`)?
3. **Medical caseload scope:** Does medical access apply to all athletes, or only an assigned caseload? The brief says "within their authorized care scope" but does not define how that scope is determined.
4. **Practice/game plan ownership:** Is a plan visible to all coaching staff team-wide, or only to the coach who created it?
5. **Dual roles:** Can one staff member hold more than one role (e.g., coaching and scouting)? The brief lists this as an open question.
6. **Directory fields:** Exactly which player roster fields count as "shared directory information" the brief says all roles may see?

## Acceptance for implementers

- [ ] Three roles match the brief's staff groups: coaching, scouting, medical.
- [ ] Every sensitive data kind from the brief appears as a matrix row.
- [ ] Medical/sports-science raw data is deny for coaching and scouting.
- [ ] Scouting notes are deny for medical and coaching.
- [ ] Each allow cell has a row-scope phrase, not only "yes."
- [ ] Open questions list anything the brief did not decide.