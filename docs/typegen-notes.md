# Type generation notes — scouting schema

## Migration applied
- File: supabase/migrations/001_scouting_schema.sql
- Applied via: [Supabase Dashboard SQL editor | supabase db push]
- Project: [project name / ref — no keys]

## Typegen command
- Command: `npx supabase gen types typescript --project-id [REF] > src/types/database.ts`
- Output path: src/types/database.ts

## Verify after generating
- public.Tables includes players, games, events
- Column names match the SQL (snake_case)
- events → players and events → games relationships are present

## When to regenerate
After any schema or RPC change (including the RPC migration in a later step).
Never hand-edit generated types. Change the SQL, re-apply, and regenerate.