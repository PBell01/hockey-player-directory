# Scouting Cache Invalidation Map

Each write invalidates only the query branches that can become stale. The hooks use the typed helpers in `src/lib/scouting/mutations.ts` and the key factories in `src/lib/scouting/query-keys.ts`.

| Mutation hook | Underlying write helper | Query-key factories invalidated | Reason from the scout's perspective |
| --- | --- | --- | --- |
| `useCreatePlayer` | `createPlayer` | `scoutingKeys.players.lists()`; `scoutingKeys.players.detail(result.data.id)` | The new player must appear in player lists and can be opened by its new ID. |
| `useUpdatePlayer` | `updatePlayer` | `scoutingKeys.players.lists()`; `scoutingKeys.players.detail(playerId)` | Updated player details and filterable list fields must be fresh. |
| `useUpdatePlayerNotes` | `updatePlayerNotes` | `scoutingKeys.players.lists()`; `scoutingKeys.players.detail(playerId)` | Notes may be shown in lists or on the edited player's detail view. |
| `useCreateGame` | `createGame` | `scoutingKeys.games.lists()`; `scoutingKeys.games.detail(result.data.id)` | The new game must appear in date-filtered lists and be available by ID. |
| `useUpdateGame` | `updateGame` | `scoutingKeys.games.lists()`; `scoutingKeys.games.detail(gameId)` | Updated opponent, date, or venue data must be fresh in list and detail views. |
| `useCreateScoutingEvent` | `createScoutingEvent` | `scoutingKeys.events.all()`; `scoutingKeys.events.list({ playerId })`; `scoutingKeys.events.list({ gameId })`; `scoutingKeys.events.withPlayer({ playerId })`; `scoutingKeys.events.withPlayer({ gameId })`; `scoutingKeys.players.detail(playerId)`; `scoutingKeys.games.detail(gameId)`; `scoutingKeys.aggregates.playerEventCountsForGame(gameId)` | A new observation changes event lists, the related player and game views, and that game's event and goal totals. |
| `useUpdateScoutingEvent` | `updateScoutingEvent` | `scoutingKeys.events.all()`; `scoutingKeys.events.list({ playerId })`; `scoutingKeys.events.list({ gameId })`; `scoutingKeys.events.withPlayer({ playerId })`; `scoutingKeys.events.withPlayer({ gameId })`; `scoutingKeys.players.detail(playerId)`; `scoutingKeys.games.detail(gameId)`; `scoutingKeys.aggregates.playerEventCountsForGame(gameId)` | An edited observation can change filtered event results, related views, and per-player game totals. |

## Invalidation rules

- For event writes, `playerId` and `gameId` come from the event input on create and from the returned updated event on update.
- `scoutingKeys.events.all()` covers both normal event lists and joined event lists because both branches are beneath the events key; explicit filtered keys refresh the most directly affected scout views.
- Player and game detail keys are invalidated with the IDs carried by the event.
- The aggregate key is invalidated only for the game whose event totals changed.
- Player and game writes invalidate their list prefixes and affected detail keys.
- No root `scoutingKeys.all` invalidation is used.
