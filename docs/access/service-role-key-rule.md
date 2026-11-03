# Service-role key rule

## What this key is
The service-role key is the database master key. It skips row-level security, the rules that normally decide which rows each signed-in staff person may see, so any code using it could read medical and sports-science rows a staff login must not see.

## Default deny
If a job is not named on the allowed list below, it must not use this key.

## Allowed server-only jobs
Only the jobs named here may use the key.

### Saving provider events (POST /api/events)
- Why a normal staff login is not enough: the data provider is an outside company with no staff login, so its events cannot be saved as a signed-in staff member.
- Runs on the server, not in a staff browser: yes. The key lives in server settings only, locally in `.env` and on Vercel as an environment variable.
- Does not serve the assistant scout or the video analyst: yes. The route only saves provider events and returns the event that was sent.
- Does not open medical or sports-science data to those roles: yes. The route reads and writes only the provider events table.

## Known conflict, found during the storage review
`app/server/directory.ts` also uses the key, through `app/lib/supabase.server`. That code serves staff-facing directory pages. Under this rule it is not an allowed job. It is not fixed in this step. It must be moved to a staff session client or named here with its own reason in a later fix.

## Never allowed
- Assistant scout screens, and any server code that answers those screens
- Video analyst screens, and any server code that answers those screens
- Everyday staff screens in the browser
- Using the key to read a medical flag so a shared view can hide it
- Sign-in checks, scouting reads, and game reads
- Any job not named on the allowed list

## Sealed even if a screen is buggy
Medical and sports-science data, including medical flags in a shared view, stay sealed for the assistant scout and the video analyst. Those requests must not use this key, so a bug fails closed instead of accidentally returning sealed rows.

## Tied to the brief and the audit
- Brief: docs/access/new-roles-brief.md
- Audit: docs/access/overgrant-audit.md
- Audit finding: the audit did not list the existing use in app/server/directory.ts. It listed no service-role use, so it was incomplete. The storage review found the gap.
- How this rule closes that risk: the key has one named job, and the directory use is recorded as a known conflict, not hidden.

## Where the secret lives
The real key is not in this file. It stays in server settings, outside the project. Do not paste the key, a token, or a connection string here.