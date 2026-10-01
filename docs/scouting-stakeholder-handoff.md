# Northline Hockey Scouting Stakeholder Handoff

## For scouts and ops

Northline’s Sprint 3 scouting data slice provides a typed path for players, games, scouting events, and per-game player aggregates.

The development environment now contains approved development-only scouting fixture data, and the primary scouting reads, filters, aggregate calculation, event creation, and targeted cache-refresh behavior have been exercised against that data.

The promise behind these decisions is simple: **a schema change should not silently break the board.** Generated database types, typed helpers, and acceptance checks are intended to surface incompatible changes before they quietly reach scout workflows.

The implementation is ready for the scoped Sprint 3 development handoff. This is not production authentication, authorization, or RLS sign-off.

## In-scope entities and relationships

The core scouting entities for this board are:

- **Player:** A skater or goalie Northline tracks.
- **Game:** A contest on a particular date between sides.
- **Event:** An observation about a player during a game, such as a goal, shot, hit, blocked shot, save, or note.

Every event belongs to exactly one player and exactly one game. A player and a game can each have many events. Queries must join through stable IDs, not matching names or other free text. This is the foundation for the promise that a schema change should not silently break the board.

The schema uses `public.players`, `public.games`, and `public.scouting_events`. Events reference `players.id` and `games.id` with restrictive deletes so referenced history is not silently removed.

## Development fixture data

The approved development-only fixture is `supabase/dev-scouting-seed.sql`. It provides 6 players, 3 games, and known event records covering goals, shots, hits, blocked shots, and saves. It is safe to rerun because it removes existing fixture rows before reinserting the known dataset. It must not be treated as production scouting data.

## Typed data-access boundary

Screens should use the public scouting access layer rather than importing Supabase directly.

- `src/lib/scouting/queries.ts` provides typed reads:
  - `listPlayers`
  - `getPlayerById`
  - `listGames`
  - `getGameById`
  - `listEvents`
  - `listEventsWithPlayer`
- `src/lib/scouting/mutations.ts` provides typed writes, including player, game, event, and player-notes helpers.
- `src/lib/scouting/rpc.ts` provides the typed aggregate helper `getPlayerEventCountsForGame`.
- `src/lib/scouting/hooks.ts` wraps reads and the aggregate RPC in React Query hooks.
- `src/lib/scouting/mutation-hooks.ts` wraps writes and owns targeted cache invalidation.
- `src/types/database.ts` is the generated type contract for table rows, inserts, updates, relationships, and the aggregate RPC.

The client boundary is `src/lib/supabase/client.ts`, but routes and components should consume the scouting hooks and mutation hooks instead. This keeps schema changes visible to TypeScript consumers instead of allowing an untyped query to silently drift.

## RPC aggregate

`getPlayerEventCountsForGame` calls the `player_event_counts_for_game` RPC. The aggregate calculates, for one game, each participating player’s total event count and goal count, returning `player_id`, `player_name`, `event_count`, and `goal_count`.

The database-side function is appropriate for this set-based grouped calculation and keeps the relationship and counting logic close to the source data. The application-facing call is implemented in `src/lib/scouting/rpc.ts`, exposed through `usePlayerEventCountsForGame` in `src/lib/scouting/hooks.ts`, and rendered by `src/routes/scouting/aggregates.tsx`.

This is not production security or authorization sign-off. Authentication, authorization, and production RLS policy hardening remain outside this slice.

## Cache invalidation rules

The documented map in `docs/scouting-cache-invalidation-map.md` requires targeted invalidation rather than clearing the entire scouting cache.

For `useCreateScoutingEvent` and `useUpdateScoutingEvent`, the affected families are:

- `scoutingKeys.events.all()` for event-list branches
- `scoutingKeys.events.list({ playerId })`
- `scoutingKeys.events.list({ gameId })`
- `scoutingKeys.events.withPlayer({ playerId })`
- `scoutingKeys.events.withPlayer({ gameId })`
- `scoutingKeys.players.detail(playerId)`
- `scoutingKeys.games.detail(gameId)`
- `scoutingKeys.aggregates.playerEventCountsForGame(gameId)`

Player writes target player list/detail keys. Game writes target game list/detail keys. No root `scoutingKeys.all()` invalidation is documented.

The development verification observed a successful event create, the new event appearing without a manual browser reload, and the affected aggregate loading afterward. The key targeting remains intentionally scoped; no root `scoutingKeys.all()` invalidation is used. A schema change should not silently break the board, and a cache rule should not silently leave it stale.

## Acceptance snapshot

The authoritative record is `docs/scouting-acceptance-verification.md`. The supplied Sprint 3 development verification reports:

- **Pass:** typed player reads, relationship reads, player/team filters, event filters, joined reads, safe empty states, aggregate route/calculation checks, valid event creation, event-list freshness, targeted invalidation, typed access, and mutation boundary checks.
- **Waived:** `JR-08`, the deliberately induced provider-read-failure test that was not required for development verification.
- **Fail:** none observed.

The fixture-backed verification opened `/scouting/players`, `/scouting/events`, and `/scouting/aggregates`; exercised player/team and event filters; created a valid development event; observed it in the event list without a manual reload; and loaded the affected game aggregate. The development typecheck also passed.

**Ready for stakeholder handoff: Yes, for the scoped Sprint 3 development slice.** This does not constitute production authentication, authorization, or RLS hardening sign-off.

## Out of scope / next sprint

The following are not complete and must not be treated as signed off:

- auth roles and authorization policy
- deeper Playwright/E2E coverage
- production RLS policy hardening or polish

The next sprint may provide auth-aware reads and writes, expand automated browser coverage, and harden production authorization. It should continue to preserve the typed boundary so a schema change should not silently break the board.

## Schema-evolution checklist

When the schema changes:

1. Add or alter the migration using the project’s existing schema process.
2. Regenerate `src/types/database.ts` with the repository’s observed command:
   `npx supabase gen types typescript --project-id ybcshwqzlhgvgvgqlvua | Out-File -Encoding utf8 src/types/database.ts`.
3. Run `npx tsc --noEmit` and fix every affected typed consumer, including `src/lib/scouting/queries.ts`, `src/lib/scouting/mutations.ts`, `src/lib/scouting/rpc.ts`, hooks, and routes.
4. Update cache rules and `docs/scouting-cache-invalidation-map.md` if the changed data can make additional views stale.
5. Rerun the mapper, query, hook, and acceptance checks.
6. Record any remaining runtime limitation rather than inventing or misrepresenting verification evidence.

This workflow makes schema drift visible at the type boundary instead of allowing it to silently break the board.

## Artifact index

- `docs/scouting-data-requirements.md` — product and data requirements source of truth.
- `docs/scouting-schema-notes.md` — table, relationship, nullability, index, and delete decisions.
- `docs/scouting-data-access-api.md` — public typed access boundary and import rules.
- `docs/scouting-cache-invalidation-map.md` — mutation-to-query invalidation targets.
- `docs/scouting-acceptance-verification.md` — populated acceptance results, evidence, and waivers.
- `docs/scouting-stakeholder-handoff.md` — this stakeholder-facing summary.
- `supabase/dev-scouting-seed.sql` — development-only scouting fixture data.

## Next-sprint boundaries

Sprint 3 is focused on a typed, correctly joined scouting data slice that can evolve without silently breaking the board. Future work should preserve the existing typed data-access boundary while adding only explicitly approved scouting capabilities.

Do not expand this work into public fan applications, payments, live video, fantasy features, or unrelated product workflows.
