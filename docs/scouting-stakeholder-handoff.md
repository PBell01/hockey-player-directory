# Northline Hockey Scouting Stakeholder Handoff

## For scouts and ops

Northline’s scouting data slice now has a small, typed path for players, games, scouting events, and per-game player aggregates. The UI routes use public scouting hooks, event creation uses the public mutation hook, and the data relationships use stable player and game IDs.

The promise behind these decisions is simple: **a schema change should not silently break the board.** Generated database types, typed helpers, and acceptance checks are intended to surface incompatible changes before they quietly reach scout workflows.

The implementation is not ready for full stakeholder handoff yet. The development database has no legitimate player, game, or event rows, so successful live event creation and post-mutation cache refresh have not been observed.

## In-scope entities and relationships

The data model contains exactly these core scouting entities:

- **Player:** A skater or goalie Northline tracks.
- **Game:** A contest on a particular date between sides.
- **Event:** An observation about a player during a game, such as a goal, assist, hit, or note.

Every event belongs to exactly one player and exactly one game. A player and a game can each have many events. Queries must join through stable IDs, not matching names or other free text. This is the foundation for the promise that a schema change should not silently break the board.

The schema uses `public.players`, `public.games`, and `public.scouting_events`. Events reference `players.id` and `games.id` with restrictive deletes so referenced history is not silently removed.

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

The acceptance record distinguishes code targeting from runtime freshness. The intended keys are verified by code inspection, but no successful live event create was possible, so no post-mutation React Query refetch or changed aggregate was observed. A schema change should not silently break the board, and a cache rule should not silently leave it stale; the latter still needs live-data verification.

## Acceptance snapshot

The authoritative record is `docs/scouting-acceptance-verification.md`.

- **Pass:** `JR-01`, `JR-03`, `JR-07`, `RPC-01`, `RPC-02`, `MUT-03`, `MUT-04`, `MUT-06`, `MUT-07`, `MUT-08`, `TYPE-01`, `TYPE-02`, `TYPE-03`, `TYPE-04`.
- **Waived:** `JR-02`, `JR-04`, `JR-05`, `JR-06`, `JR-08`, `RPC-03`, `RPC-04`, `RPC-05`, `MUT-01`, `MUT-02`, `MUT-05`.
- **Fail:** none.

Runtime observations included opening `/scouting/players`, `/scouting/events`, and `/scouting/aggregates`; the player and event routes showed safe empty states, and the aggregate route showed its no-selection and empty states. The event validation error was also observed.

The following were not verified because no live scouting rows or supported seed/fixture mechanism were available:

- relationship comparison against real player, game, and event rows
- meaningful player/team and event filter checks
- aggregate count and goal spot-checks
- successful event creation
- event appearance after creation without a browser reload
- aggregate refresh after a successful mutation

The acceptance gate is explicitly: **Ready for stakeholder handoff: No.** This is an environment-data limitation, not an observed code failure.

## Out of scope / next sprint

The following are not complete and must not be treated as signed off:

- auth roles and authorization policy
- deeper Playwright/E2E coverage
- production RLS policy hardening or polish

The next sprint should provide an approved way to obtain legitimate non-production scouting data, complete the live mutation and cache-refresh checks, and then address auth-aware access before expanding privileged workflows. It should continue to preserve the typed boundary so a schema change should not silently break the board.

## Schema-evolution checklist

When the schema changes:

1. Add or alter the migration using the project’s existing schema process.
2. Regenerate `src/types/database.ts` with the repository’s observed command:
   `npx supabase gen types typescript --project-id ybcshwqzlhgvgvgqlvua | Out-File -Encoding utf8 src/types/database.ts`.
3. Run `npx tsc --noEmit` and fix every affected typed consumer, including `src/lib/scouting/queries.ts`, `src/lib/scouting/mutations.ts`, `src/lib/scouting/rpc.ts`, hooks, and routes.
4. Update cache rules and `docs/scouting-cache-invalidation-map.md` if the changed data can make additional views stale.
5. Rerun the mapper, query, hook, and acceptance checks.
6. Record any remaining live-data waiver rather than inventing records or marking a runtime observation complete.

This workflow makes schema drift visible at the type boundary instead of allowing it to silently break the board.

## Artifact index

- `docs/scouting-data-requirements.md` — product and data requirements source of truth.
- `docs/scouting-schema-notes.md` — table, relationship, nullability, index, and delete decisions.
- `docs/scouting-data-access-api.md` — public typed access boundary and import rules.
- `docs/scouting-cache-invalidation-map.md` — mutation-to-query invalidation targets.
- `docs/scouting-acceptance-verification.md` — populated acceptance results, evidence, and waivers.
- `docs/scouting-stakeholder-handoff.md` — this stakeholder-facing summary.

## Next-sprint boundaries

Next work may add approved test data access, complete runtime acceptance verification, and design auth-aware reads and writes. It should not bypass `src/lib/scouting/*`, add direct route-level Supabase calls, or treat the current empty-database waiver as a successful live-data result.

Do not expand this handoff into public fan applications, payments, live video, fantasy features, or unrelated product workflows. Keep the work focused on a typed, correctly joined scouting board that can evolve without silently breaking.
