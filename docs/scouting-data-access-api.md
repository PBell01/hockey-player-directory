# Scouting Data Access API

## Purpose

This API is the typed access layer for Northline Hockey scouting data. Screens should use these helpers instead of reaching directly into Supabase.

## Allowed imports (public)

| Export | Scout use |
| --- | --- |
| `listPlayers` | List players, optionally filtered by position or team/org label. |
| `getPlayerById` | Load one player by stable ID. |
| `listGames` | List games, optionally filtered by date range. |
| `getGameById` | Load one game by stable ID. |
| `listEvents` | List scouting events, optionally filtered by player, game, or event type. |
| `listEventsWithPlayer` | List events with joined player fields for event review. |
| `createScoutingEvent` | Create a typed scouting event for a player in a game. |
| `updatePlayerNotes` | Update notes for one player. |
| `getPlayerEventCountsForGame` | Show event and goal counts by player for one game. |

These exports come from `src/lib/scouting/queries.ts`, `src/lib/scouting/mutations.ts`, and `src/lib/scouting/rpc.ts`.

## Private

- `src/lib/supabase/client.ts` must not be imported outside `src/lib/scouting/*`.
- Routes and hooks must not contain raw `supabase.from(...)` calls.
- `supabase.rpc('string', ...)` calls must not appear outside `src/lib/scouting/rpc.ts`.
- The app must not contain hand-written SQL strings. SQL belongs in migrations and database-side functions.

## Type contract

- All scouting helpers use types from `src/types/database.ts`.
- Regenerate `src/types/database.ts` after any migration or RPC change.
- RPC results must use generated return types or equivalent typed inference. Do not use `any` for RPC results.
- Filters and mutation inputs must match the actual table and column names in the generated database types.

## Stability rule

If a screen needs data that is not exposed by this API, add a typed helper in `src/lib/scouting/*` and update this document. Do not bypass the layer with a direct Supabase query or an untyped RPC call.
