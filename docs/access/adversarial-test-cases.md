# Break-tests: who I will pretend to be

Status: not run yet. No pass or fail is recorded in this file.

How I filled Expected: I copied allow or deny from docs/access/access-matrix-v2.md. I did not guess.

Rules:
- Role names and data names match the access matrix.
- No passwords, keys, or tokens are in this file.
- Test-account secrets are environment variables. Names only, no values.

Real-schema mapping used by the tests:
- Scouting data = `scouting_events`
- Game data = `games`
- Medical data = `medical_records` (logical name, does not exist in the real database yet)
- Sports-science data = `sports_science_records` (logical name, does not exist yet)
- Shared scouting view = the /scouting screen's data source, `scouting_events` and `games` (no database view exists)

## Environment variable names (names only)
- Assistant scout email: TEST_ASSISTANT_SCOUT_EMAIL
- Assistant scout password: TEST_ASSISTANT_SCOUT_PASSWORD
- Video analyst email: TEST_VIDEO_ANALYST_EMAIL
- Video analyst password: TEST_VIDEO_ANALYST_PASSWORD
- Medical role email: TEST_MEDICAL_EMAIL
- Medical role password: TEST_MEDICAL_PASSWORD
- Public settings (not secret): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

## Cases

### AS-READ-SCOUT
- Case id: AS-READ-SCOUT
- Actor: Assistant scout
- Action: read
- Target: scouting_events
- Expected: allow
- Matrix cell: Assistant scout / Scouting notes / See, Add
- Why: The brief says the assistant scout views scouting observations, so the new rules must not lock them out.
- Test name: AS-READ-SCOUT

### AS-READ-GAME
- Case id: AS-READ-GAME
- Actor: Assistant scout
- Action: read
- Target: games
- Expected: allow
- Matrix cell: Assistant scout / Game data / See
- Why: They need schedules and results to know which games to scout.
- Test name: AS-READ-GAME

### VA-READ-SCOUT
- Case id: VA-READ-SCOUT
- Actor: Video analyst
- Action: read
- Target: scouting_events
- Expected: allow
- Matrix cell: Video analyst / Scouting notes / See
- Why: The analyst reads existing scouting notes for context.
- Test name: VA-READ-SCOUT

### VA-READ-GAME
- Case id: VA-READ-GAME
- Actor: Video analyst
- Action: read
- Target: games
- Expected: allow
- Matrix cell: Video analyst / Game data / See
- Why: Game data is the analyst's primary working data.
- Test name: VA-READ-GAME

### AS-READ-MED
- Case id: AS-READ-MED
- Actor: Assistant scout
- Action: read
- Target: medical_records
- Expected: deny
- Matrix cell: Assistant scout / Medical records / Deny
- Why: Medical data stays sealed from this job.
- Test name: AS-READ-MED

### AS-CHANGE-MED
- Case id: AS-CHANGE-MED
- Actor: Assistant scout
- Action: change
- Target: medical_records
- Expected: deny
- Matrix cell: Assistant scout / Medical records / Deny
- Why: A sealed record must not be editable either.
- Test name: AS-CHANGE-MED

### AS-READ-SS
- Case id: AS-READ-SS
- Actor: Assistant scout
- Action: read
- Target: sports_science_records
- Expected: deny
- Matrix cell: Assistant scout / Sports-science data / Deny
- Why: Sports-science data stays sealed from this job.
- Test name: AS-READ-SS

### AS-CHANGE-SS
- Case id: AS-CHANGE-SS
- Actor: Assistant scout
- Action: change
- Target: sports_science_records
- Expected: deny
- Matrix cell: Assistant scout / Sports-science data / Deny
- Why: Sealed data must not be editable.
- Test name: AS-CHANGE-SS

### VA-READ-MED
- Case id: VA-READ-MED
- Actor: Video analyst
- Action: read
- Target: medical_records
- Expected: deny
- Matrix cell: Video analyst / Medical records / Deny
- Why: Checked separately from the scout, because the roles are separate.
- Test name: VA-READ-MED

### VA-CHANGE-MED
- Case id: VA-CHANGE-MED
- Actor: Video analyst
- Action: change
- Target: medical_records
- Expected: deny
- Matrix cell: Video analyst / Medical records / Deny
- Why: Sealed data must not be editable.
- Test name: VA-CHANGE-MED

### VA-READ-SS
- Case id: VA-READ-SS
- Actor: Video analyst
- Action: read
- Target: sports_science_records
- Expected: deny
- Matrix cell: Video analyst / Sports-science data / Deny
- Why: Performance on video is not sports-science data.
- Test name: VA-READ-SS

### VA-CHANGE-SS
- Case id: VA-CHANGE-SS
- Actor: Video analyst
- Action: change
- Target: sports_science_records
- Expected: deny
- Matrix cell: Video analyst / Sports-science data / Deny
- Why: Sealed data must not be editable.
- Test name: VA-CHANGE-SS

### AS-FLAG-SHARED
- Case id: AS-FLAG-SHARED
- Actor: Assistant scout
- Action: read
- Target: shared scouting screen data (scouting_events and games), checked for any medical-flag column
- Expected: deny (no medical flag may appear)
- Matrix cell: Assistant scout / Medical flags in shared scouting views / Deny
- Why: A flag such as "injured" on a scouting screen is still medical information.
- Test name: AS-FLAG-SHARED

### VA-FLAG-SHARED
- Case id: VA-FLAG-SHARED
- Actor: Video analyst
- Action: read
- Target: shared scouting screen data (scouting_events and games), checked for any medical-flag column
- Expected: deny (no medical flag may appear)
- Matrix cell: Video analyst / Medical flags in shared scouting views / Deny
- Why: Same leak, checked separately for this role.
- Test name: VA-FLAG-SHARED

### MED-READ-MED (control case)
- Case id: MED-READ-MED
- Actor: Medical role
- Action: read
- Target: medical_records
- Expected: allow
- Matrix cell: Medical / Medical records / See, Add, Change
- Why: Control case. If medical data were hidden from everyone, the deny tests above would pass for the wrong reason.
- Test name: MED-READ-MED

### ANON-READ-SCOUT (my own added case)
- Case id: ANON-READ-SCOUT
- Actor: Signed-out visitor (anon key, no login)
- Action: read
- Target: scouting_events
- Expected: deny
- Matrix cell: no role has a "signed out" row; every policy in the migration is limited to signed-in staff with a named role, so default deny applies
- Why: The anon key is public in the browser bundle, so a signed-out direct API call must get nothing.
- Test name: ANON-READ-SCOUT