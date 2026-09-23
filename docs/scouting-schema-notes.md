# Northline Hockey Scouting Schema Notes

The migration in `supabase/migrations/001_scouting_schema.sql` is the implementation contract for the first Northline Hockey scouting schema. It creates only the three required core tables: players, games, and scouting events.

## 1. Table purposes

### `public.players`

Stores the skaters and goalies Northline tracks. Each player has a stable UUID, a required name, a position, and a team or organization label for scout filters.

### `public.games`

Stores contests. Each game has a stable UUID, a required opponent, and a required calendar date. Optional venue and home/away status provide basic game context without adding a separate team or venue table.

### `public.scouting_events`

Stores observations made about a player during a game. Each event identifies exactly one player and one game, and records an event type plus optional period, clock time, and notes.

## 2. Important columns

### Players

- `id` is the UUID primary key and stable reference for joins.
- `name` is required and cannot be blank.
- `position` is required text so player lists can support position filtering without relying on free-text names.
- `team_org_label` is required text for the team or organization filter described in the requirements.
- `created_at` records when the player row was created.

### Games

- `id` is the UUID primary key and stable reference for joins.
- `opponent` is required and cannot be blank.
- `game_date` uses PostgreSQL `date` because the requirements call for filtering games by date range, not by a time of day.
- `venue` is optional basic context.
- `home_away_status` is optional and, when present, is limited to `home`, `away`, or `neutral`.
- `created_at` records when the game row was created.

### Scouting events

- `id` is the UUID primary key.
- `player_id` is required and points to `public.players.id`.
- `game_id` is required and points to `public.games.id`.
- `event_type` is required and cannot be blank. Goal totals can later be calculated from the agreed event type for goals.
- `period` is optional because some observations may not have a period yet; when present, it must be positive.
- `clock_time` is optional and stores a hockey-style `MM:SS` value as text, rather than treating it as a time of day.
- `notes` is optional free-text context.
- `created_at` records when the event row was created.

## 3. Relationships

- One player can have many scouting events through `scouting_events.player_id`.
- One game can have many scouting events through `scouting_events.game_id`.
- Every scouting event must reference one existing player and one existing game.
- Queries must use these UUID references for joins and combined filters, not matching names or opponent text.

The foreign keys use `ON DELETE RESTRICT`. A player or game cannot be deleted while events still reference it, which protects the event history and prevents broken joins.

## 4. Filters and supporting indexes

- Player position filtering uses `players.position` and `players_position_idx`.
- Team or organization filtering uses `players.team_org_label` and `players_team_org_label_idx`.
- Game date-range filtering uses `games.game_date` and `games_game_date_idx`.
- Events by player use `scouting_events.player_id` and `scouting_events_player_id_idx`.
- Events by game use `scouting_events.game_id` and `scouting_events_game_id_idx`.
- Events by both player and game use the composite `scouting_events_player_id_game_id_idx`.
- Per-player event counts and goal totals can be calculated by grouping events by `player_id`; goal totals depend on the later agreed value for `event_type` representing a goal.

## 5. Nullability decisions

- Player name, position, and team or organization label are required because the requirements need those values for player display and filters. Blank values are rejected.
- Game opponent and date are required because they identify the contest and support the game view and date filter. Blank opponents are rejected.
- Event player, game, and type are required because every event must be attributable and classifiable.
- Event period, clock time, notes, game venue, and home/away status are optional context. The requirements describe these as useful context rather than mandatory identifying data.
- All three tables have required `created_at` timestamps with database defaults.

## 6. Delete decisions

`scouting_events.player_id` and `scouting_events.game_id` both use `ON DELETE RESTRICT`. This preserves referential integrity and prevents deleting a player or game while its event records remain. No cascade behavior was added because the requirements do not provide a reason to erase historical observations automatically.

## 7. Open questions for a later step

- What controlled vocabulary should be used for `event_type`, including the exact value for goals?
- Should positions be a controlled set, or should Northline allow additional scouting position labels?
- Should team or organization labels eventually become shared reference data, or should the current text label remain sufficient?
- Should period values explicitly support overtime and shootout conventions?
- What authentication, authorization, and RLS rules should protect reads and writes? RLS policies are intentionally not included in this migration.
- What cache invalidation behavior is required after player or event changes once caching is introduced?

This migration has not been applied to Supabase. No application code, RPCs, seed data, or generated types are included.
