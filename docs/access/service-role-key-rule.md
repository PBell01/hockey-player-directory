# Service-role key rule

## What this key is
The service-role key is the database master key. It skips row-level security, the rules that normally decide which rows each signed-in staff person may see, so any code using it could read medical and sports-science rows a staff login must not see.

## Default deny
If a job is not named on the allowed list below, it must not use this key.

## Allowed server-only jobs
Only the jobs named here may use the key.

### none
- Why a normal staff login is not enough: not applicable — allowed list is none. Every server-only module in this app (the browser client, the server client, require-session, get-current-staff, scouting-notes) uses the public anon key, not the service-role key.
- Runs on the server, not in a staff browser: not applicable
- Does not serve the assistant scout or the video analyst: not applicable
- Does not open medical or sports-science data to those roles: not applicable

## Never allowed
- Assistant scout screens, and any server code that answers those screens
- Video analyst screens, and any server code that answers those screens
- Everyday staff screens in the browser
- Using the key to read a medical flag so a shared view can hide it
- Sign-in checks, scouting reads, and game reads
- Any job not named on the allowed list — which today is every job in this app

## Sealed even if a screen is buggy
Medical and sports-science data, including medical flags in a shared view, stay sealed for the assistant scout and the video analyst. Those requests must not use this key, so a bug fails closed instead of accidentally returning sealed rows.

## Tied to the brief and the audit
- Brief: docs/access/new-roles-brief.md
- Audit: docs/access/overgrant-audit.md
- Audit finding, in the audit's own words, or: The audit named no service-role use. (See your committed overgrant-audit.md — if it found a service-role reference anywhere, copy that exact sentence here instead of this line before committing.)
- How this rule closes that risk: since no code in this app currently uses the service-role key, this rule documents that the key must stay unused by default going forward, so a future screen, scout tool, or analyst tool cannot be "fixed" by reaching for the master key instead of fixing its RLS policy or session check.

## Where the secret lives
The real key is not in this file. It stays in server settings, outside the project. Do not paste the key, a token, or a connection string here.