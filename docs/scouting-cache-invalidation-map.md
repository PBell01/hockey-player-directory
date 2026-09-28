# Scouting Cache Invalidation Map

This map records the cache entries made stale by the write helpers that currently exist in `src/lib/scouting/mutations.ts`. The mutation hooks use only the related branches and resource details; they do not invalidate the entire scouting cache.

| Mutation hook | Underlying write helper | Query-key factories invalidated | Reason from the scout's perspective |
| --- | --- | --- | --- |
| `useUpdatePlayerNotes` | `updatePlayerNotes` | `scoutingKeys.players.lists()`; `scoutingKeys.players.detail(playerId)` | A player's notes may appear in any player list or on that player's detail view, so both must show the saved notes. |
| `useCreateScoutingEvent` | `createScoutingEvent` | `scoutingKeys.events.all()`; `scoutingKeys.players.detail(player_id)`; `scoutingKeys.games.detail(game_id)`; `scoutingKeys.aggregates.playerEventCountsForGame(game_id)` | The new observation changes event lists, the related player/game views, and that game's per-player event and goal totals. |
| Not currently available | No `createPlayer` helper is exported from `mutations.ts` | None | No player-create write exists, so no mutation hook or invalidation policy is invented here. |
| Not currently available | No `updatePlayer` helper is exported from `mutations.ts` | None | The current write is limited to player notes through `updatePlayerNotes`; broader player updates are not exposed. |
| Not currently available | No `createGame` helper is exported from `mutations.ts` | None | No game-create write exists, so no mutation hook or invalidation policy is invented here. |
| Not currently available | No `updateGame` helper is exported from `mutations.ts` | None | No game-update write exists, so no mutation hook or invalidation policy is invented here. |
| Not currently available | No `updateScoutingEvent` helper is exported from `mutations.ts` | None | Event creation is available, but event update is not currently exposed. |

## Invalidation rules

- `scoutingKeys.events.all()` covers both normal event lists and joined event lists because both branches are beneath the events key.
- Player and game detail keys are invalidated with the IDs carried by the created event.
- The aggregate key is invalidated only for the game whose event totals changed.
- Player note updates invalidate player list prefixes and the edited player's detail key.
- No root `scoutingKeys.all` invalidation is used.
