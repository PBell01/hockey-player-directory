# Sprint 6 hardening handoff

Audience: hockey operations leads and the instructor. This note records that the roster tool is closer to holding confidential roster decisions. It is not approval to store them, and it is not a claim that the tool is fully safe.

## Client story

The tool is about to hold confidential roster decisions: who is injured, who might be traded, and what scouts wrote. Before that data is trusted, the app has to survive a hostile review. A hostile review means someone tries to break in or peek at another team's notes, not a polite demo.

## What we mapped

Source: `docs/security/attack-surface-map.md`

An attack surface is every place a request, a URL, a form, or a package can cause harm. The map lists five doors: the player page, the scouting pages, the login page, and the two routes that accept outside data (`src/routes/api/events.ts` and `src/routes/api/evaluations.ts`). It attaches these harms where the files support them:

- Cross-site scripting (XSS): a harmful script sneaks into a page, for example through text a scout typed.
- Cross-site request forgery (CSRF): a trick makes a signed-in staff member's browser send a change they did not mean to send.
- Injection: smuggled text changes a database query or a command.
- Insecure direct object reference (IDOR): changing an id in the web address opens someone else's record.

## Defenses that landed

- Security headers (extra safety rules the server sends to the browser): defined in `src/server/securityHeaders.ts`, attached to every page by `vercel.json`. Notes: `docs/security/security-headers-notes.md`. One rule was loosened after the first version blanked the live site. Scripts written inside the page are currently allowed, because the framework writes them on every page. That weakens protection against XSS until a per-request code (a nonce) is added. This is an accepted, recorded risk.
- CSRF and origin checks (refuse a change that did not start from our own site): `src/server/csrf.ts`, called first in `src/routes/api/events.ts` and `src/routes/api/evaluations.ts`. Notes: `docs/security/csrf-defense-notes.md`. It needs the `APP_ORIGIN` setting on the host, or every change is refused. Consequence: the outside data provider sends no browser origin, so it would also be refused. A separate way to identify the provider is still to be decided.
- Authorization that blocks IDOR (a signed-in person must not open a record just by changing an id): `src/server/authorizeResource.ts` checks the id shape, reads the person's role on the server, and applies the role matrix. It is enforced in `src/server/scouting-notes.ts`. The scouting list has no single id, so it is gated by role for the whole list, and row-level security still filters the rows. Notes: `docs/security/idor-defense-notes.md`.

## Dependency and supply-chain review

Source: `docs/security/dependency-risk-review.md`

A dependency is code this project installs from someone else. The supply chain is that chain of packages and updates. The review lists all 24 direct packages, says what each does in this tool, and whether it can affect sign-in, page output, or server requests. No packages were upgraded in that review. Risks that remain:

- One advisory in `seroval` (a library that passes data between server and browser) is not accepted, and needs checking and a separate tested fix.
- `nitro`, which runs the deployed server, is installed as a nightly build. That is not accepted, and it should be pinned to a released version.
- A build-time styling advisory is accepted, because it only touches our own style files.

## How a player read is layered now

Source: `docs/adr/0001-service-and-data-access-layers.md`

An architecture decision record (ADR) is a short note of a structural choice and why it was made. One player-roster read is split into three layers, so business rules can change without rewriting web handling:

1. Thin server boundary: `src/server/getPlayerRoster.ts`. It checks the id, works out who is asking from the server session, calls the service, and returns a short fixed answer. It holds no roster rules.
2. Service: `src/services/playerRosterService.ts`. It holds the business rules: who may open a player, and who may also see confidential notes.
3. Data access: `src/data/playerAccess.ts`. It loads the player row, passing the id as a value and never as query text.

The player page is `src/routes/players/$playerId.tsx`. It calls the thin server boundary and does not talk to the database itself.

## What the service test shows

Source: `src/services/playerRosterService.test.ts`

This test checks the roster business rules without sending a web request. It uses stand-in data, so there is no browser, route, or database. It checks that a role allowed to see confidential notes gets them, that a role that may open the player but not read notes does not, and that a refused request returns none of the stored facts. The result is recorded in the next section.

## Still manual

- Row-level security (RLS) from earlier sprints still decides, inside the database, which rows each role can see. This sprint did not replace it or turn it off.
- Hosting stays on the one existing Vercel Hobby project. No second project was created. The Production URL is in `docs/vercel-hobby-setup.md`.
- The `players` table still has an old development rule that lets anyone read it, so the role check is the main control on player reads.
- Older directory code uses the database master key, which conflicts with `docs/access/service-role-key-rule.md`. It is recorded and not yet fixed.
- The outside provider is not yet identified, and evaluations are accepted but not saved.
- A signed-in staff member is still not allowed to see every player. The role matrices remain the source of who may see what.

## Verification we actually ran

- Player roster service test: `npx vitest run src/services/playerRosterService.test.ts`. Observed: 1 test file passed (1), 4 tests passed (4), duration 366ms. The four tests were: allowed scouting role gets name and notes; role that may open the player but not read notes gets no notes; denied id returns not_allowed with none of the stored facts; blank id is refused before authorization or loading.
- Handoff file saved at `docs/handoff/sprint6-hardening-handoff.md`. Observed: the file exists at that path.

The Production URL was not re-checked in this note. That check is next.

## What to extend next

- Immediate next check: open the existing Production URL in `docs/vercel-hobby-setup.md`. Confirm it returns HTTP 200 and renders the app. Do not create a new host to do that.
- Later work should extend the same defenses (headers, origin checks, authorization against IDOR) to routes this sprint did not guard.
- Replace inline scripts with a nonce, identify the provider, and tighten the `players` rule.
- Do not extend this work by removing RLS or opening a second Vercel project.

## What this note does not claim

- The app is not fully secure.
- Confidential roster decisions are not approved to store yet. The tool is closer, because mapped holes have named defenses and one player read can be tested without a web request.
- No secrets belong here, and none are included.