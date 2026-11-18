# ADR 0001: Service and data-access layers for player roster reads

## Status

Accepted. The three layers below already exist in the repository.

## Context

Confidential roster information (injuries, trade talk, and scout notes) needs rules about who may see what. Before this change, rules like these tended to live inside the code that handles web requests. That meant changing a rule required touching the request path, and testing a rule meant pretending to be a browser. It also made it easy to forget a check: if the page or route talks to the database directly, nothing forces the "who may see this player" rule to run first.

## Decision

Reading one player's roster is split into three layers, with calls going in one direction only: boundary, then service, then data access, then the database. This matches `docs/architecture/layer-map.md`.

- `docs/architecture/layer-map.md` is the picture of the three layers and what each may and must not do.
- `src/server/getPlayerRoster.ts` is the thin server boundary. It checks that the player id has a safe shape, works out who is asking from the server session, calls the service, and returns either the player or a short fixed error. It holds no roster rules and does not query the database.
- `src/services/playerRosterService.ts` is the service layer. It holds the business rules: whether this staff member may open the player, and whether they may also learn confidential notes. It takes the person asking as plain data and returns plain outcomes, so it can be tested without HTTP.
- `src/data/playerAccess.ts` is the data-access layer. It loads one player row through the signed-in server client, passing the id as a parameter. It does not decide who may see the player.

## Options considered

- **Rejected: leave the roster rules inside the HTTP route.** This keeps the rules tied to requests, cookies, and status codes, so they cannot be tested without pretending to be a browser, and a small route edit can quietly drop a check.
- **Rejected: put the rules only in the page.** Hiding fields on the screen does not stop a direct request, and the same rule would have to be copied wherever a player is shown.

No other architecture, such as separate services or a new database, was adopted.

## Consequences

- **Positive:** business-rule tests can call the service directly with fakes, with no HTTP, route, or database. `src/services/playerRosterService.test.ts` does this.
- **Positive:** future roster routes should call the service through the boundary and must not reach past it into data access.
- **Positive:** a rule change happens in one place, the service, instead of in every route.
- **Cost:** there are more files to keep in agreement with the layer map.
- **Known gap:** the older directory pages still read through `directoryLoader`, outside these layers, and the `players` table still has an open development policy. Moving those pages onto the boundary is later work.