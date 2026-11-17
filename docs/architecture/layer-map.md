# Layer map: one player read

This map is only for reading one player in the hockey roster tool. It does not change the database.
Source of the risks: `docs/security/attack-surface-map.md` (player URL row).

## Route layer (routing boundary)
- May: receive the web request, read the player id from the URL, call the service, and turn the result into a response.
- Must not: query Supabase, build SQL, or hide roster rules inside a React page.
- File this step: none. `src/routes/players/$playerId.tsx` is unchanged. A later step adds the thin server function (`src/server/getPlayerRoster.ts`, not created yet).

## Service layer
- May: apply roster rules for this read, including whether this staff member may see this player (using `src/server/authorizeResource.ts`), then call data access.
- Must not: build an HTTP response, render React, or paste the player id into a SQL string.
- File this step: none. `src/services/playerRosterService.ts` is the next step and is not created yet.

## Data-access layer
- May: load one player row from the existing `players` table through the existing signed-in server client (`getAuthedServerClient`), passing the player id as a parameter.
- Must not: decide who is allowed to see the player, create HTTP responses or security headers, import React, or use the service-role key.
- File this step: `src/data/playerAccess.ts`

## Call direction
Route calls service. Service calls data access. Data access calls Supabase. A lower layer must not call upward into HTTP.

## Tied to the attack-surface map
- Injection on this read is closed in the data-access layer by a bound id (`.eq('id', playerId)`), not by gluing the id into SQL text.
- IDOR is not closed here. Who may see the row stays in the service layer, using the authorization check already in the repo. Row-level security remains the database backstop because the client is the user-scoped one.

## Known limit
The `players` table still has an open development policy readable by anyone, so row-level security does not yet hide player rows. The service-layer role check is the control that matters for now.