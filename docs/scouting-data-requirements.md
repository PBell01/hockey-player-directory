# Northline Hockey Scouting Data Requirements

## 1. Actors and goals

| Actor | Goal | What they need from data |
| --- | --- | --- |
| Scout | Review player performance and observations | Player records, games, events, filters, and per-player totals that remain correctly connected. |
| Hockey operations user | Find relevant scouting information quickly | Player lists, game lists, and event views filtered by position, team/org label, date, player, or game. |
| Ops/data steward | Maintain consistent reference data and protect joins as the schema changes | Clear player/game/event relationships, stable identifiers, and type-safe data access paths that reveal incompatible schema changes. |

## 2. Core entities and relationships (plain language)

- **Player:** A skater or goalie Northline tracks.
- **Game:** A contest occurring on a particular date between sides.
- **Event:** Something observed about a player during a game, such as a goal, assist, hit, or note.

The relationships are:

- One player can have many events.
- One game can have many events.
- Every event belongs to exactly one player and exactly one game.
- Player and game relationships must use actual data relationships and stable identifiers, not only matching free-text names.
- An event list filtered by a player must contain only events belonging to that player.
- An event list filtered by a game must contain only events belonging to that game.
- An event list filtered by both must contain only events belonging to that player in that game.

## 3. Filters and scout views

The project must provide these data views and filters:

- **Players view:** List players, optionally filtered by position or team/org label.
- **Games view:** List games, optionally filtered by a date range.
- **Events by player:** List events associated with one selected player.
- **Events by game:** List events associated with one selected game.
- **Events by player and game:** List only the events matching both selected references.
- **Player summary view:** Show per-player aggregates such as event counts or goal totals.

Player, game, and event results must remain correctly joined when filters are combined. A filter must not include a record only because its display name happens to match another record's name.

Relevant player and event data must support create and update operations through type-safe data-access paths. The data requirements do not prescribe the implementation of those paths.

## 4. Measurable success criteria

- **Join integrity:** For every returned event, its player reference resolves to exactly one player and its game reference resolves to exactly one game. An automated check must identify any event with a missing or ambiguous player or game relationship.
- **Player filter correctness:** Given a known set of players with different positions and team/org labels, a position filter returns every and only the players with that position, and a team/org filter returns every and only the players with that label.
- **Game date filter correctness:** Given games inside, before, and after a selected date range, the result includes every and only the games whose dates fall within the range.
- **Player event filtering:** Given events for multiple players, filtering by one player returns every and only that player's events.
- **Game event filtering:** Given events for multiple games, filtering by one game returns every and only that game's events.
- **Combined player and game filtering:** Given events for multiple players and games, filtering by both references returns every and only events belonging to both the selected player and selected game.
- **Schema-change/type-safety protection:** When a required player, game, or event field is renamed, removed, or changed to an incompatible type, the typed data-access checks fail before the affected query or data path is accepted as ready.
- **Per-player aggregates:** For a fixture with known event totals, each player's event count and goal total match the events linked to that player, with no events from another player included.
- **Create and update integrity:** A created or updated event must reference one valid player and one valid game, and a created or updated player must remain available to the player views and aggregates that use it.
- **Cache freshness and invalidation:** When caching becomes part of the later implementation, a successful create or update must cause affected player, game, event, and aggregate views to show the changed data on their next required read; stale results must not remain after the defined invalidation point.

## 5. Short glossary

- **Aggregate:** A calculated summary, such as a player's total goals or event count.
- **Event:** An observation recorded for a player during a game.
- **Filter:** A condition that limits a view to matching records.
- **Join:** Connecting records through their actual relationships, such as an event's player and game references.
- **Reference data:** Shared player, game, or other identifying information that must stay consistent across records.
- **Stable identifier:** A value used to identify one record consistently, even when its display name changes.
- **Team/org label:** The team or organization label used to group or filter players.
- **Type-safe data access:** Data access whose expected fields and types are checked so incompatible schema changes are found before use.

## 6. Source of truth

The authoritative records are the project’s player, game, and event data. Relationships must be based on the stored references between those records, not on copied or matching names.

The source of truth must provide the fields needed to identify players and games, associate each event with exactly one player and one game, apply the required filters, calculate per-player aggregates, and support the required player and event changes through type-safe data-access paths.

When the schema evolves, the authoritative field definitions and relationships must remain aligned with the typed data-access expectations. A view or aggregate is correct only when it can be traced back to the authoritative player, game, and event records.

Public fan applications, payments, live video, and fantasy features are out of scope for this project.
