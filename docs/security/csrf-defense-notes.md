# CSRF and origin checks

Source of the risk: `docs/security/attack-surface-map.md` (events ingestion and evaluations ingestion).

## The scout story
A scout is signed in to the roster tool. Their browser holds a sign-in cookie. Another website gets that browser to send a change to our app, and the browser may attach the cookie automatically. The cookie proves who is signed in. It does not prove the scout's own page started the request. That trick is cross-site request forgery (CSRF). The harm is a fake scouting event or evaluation stored under the scout's session.

## What the server refuses
`src/server/csrf.ts` refuses a write with status 403 when the method is POST, PUT, PATCH, or DELETE and any of these is true:
- The allowlist is empty (fails closed, so a forgotten setting never allows every site).
- `Sec-Fetch-Site` is `cross-site`.
- The `Origin` header is missing.
- The `Origin` is not on the allowlist.

GET, HEAD, and OPTIONS are not rejected here, because they only read and blocking them would break opening a player page. The status is 403, not 401, because the problem is a foreign origin, not a missing login.

## Allowlist
`APP_ORIGIN` is a comma-separated list of public origins (scheme, host, and port, with no path), for example the Production origin from `docs/vercel-hobby-setup.md` plus the local address used in development. It is not a secret. An unset or empty value means no origin is trusted.

## What this is not
- Not a login check. Supabase authentication still decides who the person is.
- Not a role check. A matching origin is not permission to see every player.
- Not a substitute for the security headers.
- Not protection against a non-browser program that invents headers. That is why authentication and row-level security stay in place.

## Where it will be used next
Not wired yet. The next places to call it are `src/routes/api/events.ts` and `src/routes/api/evaluations.ts`. Those files were not edited in this step.