# Role-by-action break-test results

## How to read this table
A pass means the gate did the right thing, not that a person got the data.
- If the action should be denied, pass means the person was blocked or saw no sealed data.
- If the action should be allowed, pass means the person could still do the job.
- A forbidden action that succeeds is a fail, even when the command exits cleanly.

## Run record
- Date: 2026-10-20
- Test file: tests/access/least-privilege-roles.test.ts
- Migration: supabase/migrations/20260418120000_least_privilege_new_staff_roles.sql
- Cases taken from: docs/access/adversarial-test-cases.md
- Rules checked against: docs/access/access-matrix-v2.md
- Command run: npx vitest run tests/access/least-privilege-roles.test.ts
- The tests ran against my own course Supabase project with three test accounts: assistant scout, video analyst, and medical. No emails or passwords are recorded here.
- First-run summary: All 16 checks passed. Allowed reads were later strengthened so they must return rows, and the suite was run again.

## Results
| Role | Action | Expected | Observed | Gate result | Plain-language explanation | Test name |
| --- | --- | --- | --- | --- | --- | --- |
| Assistant scout | Read medical data | Deny | Blocked | Pass | The assistant scout asked for medical records and got nothing back. That is what we want, because scouts must not see medical data. | AS-READ-MED |
| Assistant scout | Change medical data | Deny | Blocked | Pass | The assistant scout tried to edit medical records and the change was refused. Sealed records cannot be altered by this job. | AS-CHANGE-MED |
| Assistant scout | Read sports-science data | Deny | Blocked | Pass | The assistant scout asked for training and body measurements and got nothing back. This job does not need them. | AS-READ-SS |
| Assistant scout | Change sports-science data | Deny | Blocked | Pass | The assistant scout tried to edit sports-science records and was refused. | AS-CHANGE-SS |
| Assistant scout | See medical flags in shared scouting data | Deny | Hidden | Pass | The scout opened the shared scouting and game data and no medical marker was visible. No flag column exists yet, so this is a pass with a noted risk (see Residual risks). | AS-FLAG-SHARED |
| Assistant scout | Read scouting notes | Allow | Succeeded with rows | Pass | The assistant scout could read scouting events. Their job still works. | AS-READ-SCOUT |
| Assistant scout | Read game data | Allow | Succeeded with rows | Pass | The assistant scout could read games and know which to scout. | AS-READ-GAME |
| Video analyst | Read medical data | Deny | Blocked | Pass | The video analyst asked for medical records and got nothing back. Analysts study game performance, not health records. | VA-READ-MED |
| Video analyst | Change medical data | Deny | Blocked | Pass | The video analyst tried to edit medical records and was refused. | VA-CHANGE-MED |
| Video analyst | Read sports-science data | Deny | Blocked | Pass | The video analyst asked for sports-science data and got nothing back. Performance on video is not sports-science data. | VA-READ-SS |
| Video analyst | Change sports-science data | Deny | Blocked | Pass | The video analyst tried to edit sports-science records and was refused. | VA-CHANGE-SS |
| Video analyst | See medical flags in shared scouting data | Deny | Hidden | Pass | The analyst opened the shared scouting and game data and saw no medical marker. No flag column exists yet, so this is a pass with a noted risk. | VA-FLAG-SHARED |
| Video analyst | Read scouting notes | Allow | Succeeded with rows | Pass | The video analyst could read scouting events for context. Their job still works. | VA-READ-SCOUT |
| Video analyst | Read game data | Allow | Succeeded with rows | Pass | The video analyst could read games, their main working data. | VA-READ-GAME |
| Medical (control) | Read medical data | Allow | Succeeded with rows | Pass | The medical role could read medical records. This shows the deny results above are real and not caused by hiding medical data from everyone. | MED-READ-MED |
| Signed-out visitor | Read scouting notes | Deny | Blocked | Pass | A visitor with no login asked for scouting events and got nothing. | ANON-READ-SCOUT |

## Tightening log
- Did any forbidden access succeed on the first run? No. The suite never showed a forbidden read succeeding.
- Changes to the migration: Inspecting the policy list found leftover development policies on games and scouting_events that allowed access outside the role rules. They were removed (the drops are in the migration file). The suite was not run with them in place, so the tests did not observe a leak from them.
- Changes to the test file: Allowed reads were strengthened so they must return at least one row. Before, an empty result could pass as "allowed."
- Re-run result: All 16 checks passed after the change.
- Note: The medical_records and sports_science_records tables were added as stand-ins so the deny tests would be meaningful. They did not exist in the original schema.

## Residual risks
- The players table is readable by anyone, signed in or not, through a leftover development policy, including the free-text notes column. It was left alone because the directory pages depend on it and the matrix has no players row. It needs its own decision.
- No medical-flag column or shared view exists yet, so the flag checks pass because there is nothing to find. Any future flag column or shared view needs its own rule and test.

## Not in this file
This file is the proof table only.