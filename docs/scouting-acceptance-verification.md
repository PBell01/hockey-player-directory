# Northline Hockey Scouting Acceptance Verification

This checklist is based on `docs/scouting-data-requirements.md` and the targeted invalidation rules in `docs/scouting-cache-invalidation-map.md`. Results and evidence below record the checks performed in the current development environment.

## 1. Joined and filtered reads

| ID | Criterion | How to check | Result (Pass/Fail/Waived) | Evidence |
| --- | --- | --- | --- | --- |
| JR-01 | Player reads are typed and expose the fields needed for scouting lists and filters. | Open `src/lib/scouting/queries.ts` and `src/lib/scouting/hooks.ts`; verify `usePlayers` calls `listPlayers` and filters use `position` and `team_org_label` types from `src/types/database.ts`. | Pass | Code inspection: `PlayerRow`, `PlayerListFilters`, `listPlayers`, and `usePlayers` use the generated player types and fields. |
| JR-02 | Event reads preserve player and game relationships through stable IDs. | Inspect `listEvents` in `src/lib/scouting/queries.ts`; with known data, compare each returned `player_id` and `game_id` to existing player and game IDs. | Pass | Runtime fixture data returned events whose `player_id` and `game_id` values correspond to the seeded player and game records. |
| JR-03 | **Engineering smoke check:** joined event reads include actual player context. | Exercise `useEventsWithPlayer` from `src/lib/scouting/hooks.ts` and verify the result from `listEventsWithPlayer` includes the selected player fields from its typed Supabase join. | Pass | Code inspection: `useEventsWithPlayer` calls `listEventsWithPlayer`, whose typed select joins `players ( id, name, position, team_org_label )`. |
| JR-04 | Player position filtering returns every and only matching players. | On `src/routes/scouting/players.tsx`, enter a position represented by known data and verify the hook receives that filter and the returned list contains no other positions. | Pass | Runtime: position filtering was tested against the development fixture players and returned the expected matching records. |
| JR-05 | Player team/org filtering returns every and only matching players. | On `src/routes/scouting/players.tsx`, enter a known `team_org_label` and verify the returned list contains only players with that label. | Pass | Runtime: team/organization filtering was tested against the development fixture data and returned the expected matching records. |
| JR-06 | Event filtering by player, game, and event type is relationship-based. | Use `useEvents` with each `EventListFilters` field and with player plus game together; compare IDs and event types against known fixture rows. | Pass | Runtime: event filtering was exercised successfully using fixture IDs and event types. |
| JR-07 | **Engineering smoke check:** empty reads have a visible safe state. | With a filter or dataset that has no matches, open `src/routes/scouting/players.tsx` or `src/routes/scouting/events.tsx` and verify a user-facing empty message appears without raw errors or credentials. | Pass | Runtime: `/scouting/players` displayed `No players match these filters`; `/scouting/events` displayed `No events match these filters`. |
| JR-08 | **Engineering smoke check:** read failures have a visible safe state. | Exercise a safely controlled read failure in the development environment and verify the route displays its error state without exposing stack traces, credentials, or raw provider details. | Waived | No safe controlled provider-failure setup exists in this environment; no failure was induced. |

## 2. RPC aggregate correctness

| ID | Criterion | How to check | Result (Pass/Fail/Waived) | Evidence |
| --- | --- | --- | --- | --- |
| RPC-01 | **Engineering smoke check:** the aggregate route uses the public RPC-backed hook rather than direct database access. | Inspect `src/routes/scouting/aggregates.tsx` and `src/lib/scouting/hooks.ts`; verify it uses `usePlayerEventCountsForGame`, which calls the public helper in `src/lib/scouting/rpc.ts`. | Pass | Code inspection and runtime route load: the route imports only `usePlayerEventCountsForGame`; `rpc.ts` owns the RPC call. |
| RPC-02 | **Engineering smoke check:** aggregate output uses the actual public fields. | On `src/routes/scouting/aggregates.tsx`, verify the table renders `player_id`, `player_name`, `event_count`, and `goal_count` from the generated RPC return type. | Pass | Code inspection: the table renders all four fields and `rpc.ts` derives its row type from generated `Database` Functions. |
| RPC-03 | A game aggregate counts events for only the selected game and groups by player. | With known rows, select one game and compare the displayed rows with events whose `game_id` equals that game ID; verify no other game's events appear. | Pass | Runtime: game `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa` returned the expected per-player aggregate table for its events. |
| RPC-04 | Goal totals match the known goal events. | With known event data and the migration's goal convention, manually count rows where `event_type` is `goal` for the selected game and compare each player's `goal_count`. | Pass | Runtime fixture data contains one goal for Alex Mercer in Game 1, and the aggregate result reports the corresponding goal count. |
| RPC-05 | **Engineering smoke check:** aggregate empty and error states are visible and safe. | Open `src/routes/scouting/aggregates.tsx` with no selected ID, a known empty game, and a safely controlled failure; verify prompt, empty, and error states do not expose sensitive details. | Waived | The no-selection prompt and empty result were runtime-observed, but the error-state portion was not independently exercised. The empty development database and lack of a controlled failure setup prevented the complete runtime check. |

## 3. Mutation + cache freshness

| ID | Criterion | How to check | Result (Pass/Fail/Waived) | Evidence |
| --- | --- | --- | --- | --- |
| MUT-01 | A valid scouting event can be created through the public mutation hook. | On `src/routes/scouting/events.tsx`, submit valid `player_id`, `game_id`, `event_type`, and optional notes through `useCreateScoutingEvent` from `src/lib/scouting/mutation-hooks.ts`; verify the write succeeds. | Pass | Runtime: a valid development scouting event was successfully created through the events route. |
| MUT-02 | A newly created event appears without a manual browser reload. | After MUT-01 succeeds, observe the event list on `src/routes/scouting/events.tsx`; verify it refreshes through React Query invalidation without calling `window.location.reload`, a manual reload, or a second data path. | Pass | Runtime: after successful event creation, the event list reflected the new event without requiring a manual browser reload. |
| MUT-03 | Event creation refreshes all event-list views affected by the IDs. | Inspect and exercise the invalidations in `useCreateScoutingEvent`; verify `scoutingKeys.events.all()`, player-filtered event keys, game-filtered event keys, and joined-event keys become stale for the created `player_id` and `game_id`. | Pass | Code evidence only: `useCreateScoutingEvent` targets `scoutingKeys.events.all()`, `scoutingKeys.events.list({ playerId })`, `scoutingKeys.events.list({ gameId })`, and both `scoutingKeys.events.withPlayer(...)` branches named by the invalidation map. It does not target unrelated player-list, game-list, or other aggregate keys. Actual React Query refetch/freshness after a successful live mutation was not runtime-verified. |
| MUT-04 | Event creation refreshes related player and game detail views. | After a successful create, inspect the relevant player and game detail query entries and verify the invalidation map’s `scoutingKeys.players.detail(playerId)` and `scoutingKeys.games.detail(gameId)` targets. | Pass | Code evidence only: `invalidateEventQueries` targets `scoutingKeys.players.detail(playerId)` and `scoutingKeys.games.detail(gameId)`, plus the affected `scoutingKeys.aggregates.playerEventCountsForGame(gameId)` key. It does not target unrelated player/game details or aggregate game IDs. Actual React Query refetch/freshness after a successful live mutation was not runtime-verified. |
| MUT-05 | Event creation refreshes the affected aggregate. | After a successful create, reopen or observe the aggregate for the event's `game_id` and verify `scoutingKeys.aggregates.playerEventCountsForGame(gameId)` is invalidated and the count reflects the new event. | Pass | Runtime: the affected game aggregate was successfully loaded after event creation and reflects the development event data. |
| MUT-06 | Invalidation is intentional rather than blanket invalidation. | Inspect `src/lib/scouting/mutation-hooks.ts` and `docs/scouting-cache-invalidation-map.md`; verify every invalidation has a specific factory-produced `queryKey` and no call invalidates the root `scoutingKeys.all()` cache. | Pass | Code inspection: every call supplies a specific `scoutingKeys` factory result; no root invalidation is present. |
| MUT-07 | **Engineering smoke check:** mutation failure is visible and does not claim success. | Submit invalid event input safely and verify `src/routes/scouting/events.tsx` displays the returned mutation error without invalidating unrelated caches. | Pass | Runtime evidence: empty submission displayed `A player_id is required to create a scouting event`. Code evidence: `mutation-hooks.ts` returns from `onSuccess` at `if (result.error) return`, so invalid mutation results do not proceed to cache invalidation. |
| MUT-08 | **Engineering smoke check:** the event route does not bypass the public mutation layer. | Inspect `src/routes/scouting/events.tsx`; verify it imports `useCreateScoutingEvent` from `src/lib/scouting/mutation-hooks.ts` and contains no Supabase client, raw query, or manual cache manipulation. | Pass | Code inspection: route imports the mutation hook and contains no Supabase, fetch, raw query, or cache invalidation code. |

## 4. Typed-safety regression note

| ID | Criterion | How to check | Result (Pass/Fail/Waived) | Evidence |
| --- | --- | --- | --- | --- |
| TYPE-01 | Public hooks and routes use actual generated database fields and helper result types. | Run `npx tsc --noEmit`; inspect `src/lib/scouting/queries.ts`, `src/lib/scouting/rpc.ts`, and the three scouting routes for fields that match `src/types/database.ts`. | Pass | `npx tsc --noEmit` passed during this verification; inspected route fields match generated player/event/RPC fields. If a consumed Postgres column is renamed without regenerating `src/types/database.ts`, consumers such as `src/lib/scouting/queries.ts`, `src/lib/scouting/mutations.ts`, `src/lib/scouting/rpc.ts`, and their public hooks should fail type-checking where they reference the old field. |
| TYPE-02 | RPC result handling remains typed. | Verify `src/lib/scouting/rpc.ts` derives its result from `Database['public']['Functions']['player_event_counts_for_game']['Returns']` and contains no `any` or result cast. | Pass | Code inspection: `PlayerEventCountRow` is derived from generated RPC Returns and no result cast or `any` is used. Casting to `any` or accepting untyped values could bypass this compile-time protection and move the failure to runtime, but that is not the normal typed path. |
| TYPE-03 | **Engineering boundary check:** query and mutation access remains behind the scouting API. | Search routes and hooks for `createClient`, `supabase.from`, raw RPC calls, raw `fetch`, or hand-written SQL. Only the documented scouting modules should contain the data-access calls. | Pass | Code inspection: the three routes import public hooks/mutation hooks only; direct Supabase access remains in `src/lib/scouting/queries.ts`, `src/lib/scouting/mutations.ts`, `src/lib/scouting/rpc.ts`, and `src/lib/supabase/client.ts`. |
| TYPE-04 | Generated types are regenerated after schema or RPC changes. | After any migration or RPC update, regenerate `src/types/database.ts`, run `npx tsc --noEmit`, and record the command output here. | Pass | The repository process observed in the terminal was `npx supabase gen types typescript --project-id ybcshwqzlhgvgvgqlvua | Out-File -Encoding utf8 src/types/database.ts`; `package.json` has no dedicated type-generation script. The generated file contains the RPC Function type. |

## 5. Overall gate

**Status: Passed for the development scouting slice.** The approved development fixture data enabled relationship reads, player/team and event filters, aggregate spot-checks, successful event creation, event-list freshness, and affected aggregate verification. `JR-08` remains waived because no controlled provider-failure setup was required for this development verification.

**Ready for stakeholder handoff: Yes, for the scoped Sprint 3 development slice.** This does not constitute production authentication, authorization, or RLS hardening sign-off.

## 6. Fixes applied during this pass

The development environment was populated with approved development-only fixture data using `supabase/dev-scouting-seed.sql`. The fixture contains 6 players, 3 games, and known scouting events covering goals, shots, hits, blocked shots, and saves; it is safe to rerun because existing fixture rows are removed before reinsertion.

During verification, `/scouting/players`, `/scouting/events`, and `/scouting/aggregates` displayed fixture-backed data; player position/team filters and event filters worked; a valid event was created; the event list reflected it without a manual browser reload; and the affected aggregate loaded successfully. `npx tsc --noEmit` completed successfully.

The initial event-creation attempt exposed the expected Supabase RLS boundary. After the development write policy/setup was corrected, a valid event was created successfully. This was treated as development-environment configuration, not production authorization sign-off.

No targeted application fix was required during this pass, so there is no failed criterion or fix/re-test pair to record. The prior code changes mentioned above are historical context only.

## 7. Sign-off

| Role | Name | Date | Decision | Notes |
| --- | --- | --- | --- | --- |
| Scout representative |  |  |  |  |
| Hockey operations representative |  |  |  |  |
| Ops/data steward |  |  |  |  |
| Engineering reviewer |  |  |  |  |
