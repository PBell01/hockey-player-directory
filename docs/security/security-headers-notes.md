# Security response headers

These notes explain the list in `src/server/securityHeaders.ts`.
They do not attach the headers. The live site, `vercel.json`, and the route files are unchanged in this step.
Source of the threat list: `docs/security/attack-surface-map.md`. The browser-side holes it names are XSS on the scouting pages, framing of the app, and player ids leaking in page addresses.

## What this does not replace
Headers do not sign staff in, do not replace row-level security, and do not stop CSRF or IDOR. Those are separate defenses and come in later steps.

## Header by header

### Content-Security-Policy
- Why: tells the browser which scripts, connections, and frames are allowed, so a script injected through scout-written text is less able to run or send data out.
- Scripts: `script-src 'self' 'unsafe-inline'` allows only scripts from this site. `*`, `'unsafe-inline'`, and `'unsafe-eval'` are not used, because each one undoes the XSS protection.
- Styles: `style-src` allows `'unsafe-inline'` because this app's styles need it. That is a smaller risk than inline scripts, and it must never be copied onto `script-src`.
- Network: `connect-src` lists `'self'` plus `https://*.supabase.co` and `wss://*.supabase.co`, because the browser already talks to Supabase for sign-in and data. “fonts.googleapis.com (styles) and fonts.gstatic.com (font files) are allowed because the app loads its fonts from Google.”
- Other directives: `default-src 'self'`, `object-src 'none'` (no old plugin content), `frame-ancestors 'none'`, `base-uri 'self'` and `form-action 'self'` (links and forms cannot be pointed at another site), and `upgrade-insecure-requests`.
- Too loose: `script-src *`, `'unsafe-inline'`, or `'unsafe-eval'` stops this header from reducing XSS.
- Too tight: `connect-src 'self'` alone blocks Supabase, so sign-in and data fail once the list is attached. `script-src 'self'` can blank a page that relies on an inline boot script. That blank page means the header is working. The later fix is a nonce, not opening `script-src`. `img-src 'self'` would hide photos hosted elsewhere, so a host would be added on purpose.

### X-Content-Type-Options
- Why: `nosniff` stops the browser from guessing that a text file is a script.
- Wrong value: anything other than `nosniff` gives no protection.

### Referrer-Policy
- Why: `strict-origin-when-cross-origin` keeps the full path, such as a player id in `/players/{id}`, from being sent to other sites. Only the origin goes out.
- Wrong value: `unsafe-url` sends the full address, including the player id.

### X-Frame-Options
- Why: `DENY` agrees with CSP `frame-ancestors 'none'`, so no other site can frame the app and overlay a fake click.
- Wrong value: allowing all frames reopens clickjacking. `DENY` would break any future plan to embed this app in another site. We do not need that.

### Permissions-Policy
- Why: camera, microphone, and geolocation are granted to nobody. The roster tool uses none of them. An empty list means off.
- Wrong value: `camera=*` would allow that feature broadly.

### Strict-Transport-Security
- Why: tells browsers to keep using HTTPS for this site for 180 days.
- Wrong value: adding `preload` or `includeSubDomains` is hard to undo and can lock staff out if HTTPS is ever misconfigured. This sprint does not use either. Vercel may already send this header, in which case the later attach step must not duplicate or strengthen it with preload.

### Cross-Origin-Opener-Policy
- Why: `same-origin` stops other sites from reaching into this window.
- Wrong value: adding Cross-Origin-Embedder-Policy alongside it can break Supabase and images, so that header is deliberately left out.

## Deliberately not set
- `Access-Control-Allow-Origin: *`. It invites other sites to read responses.
- `Cross-Origin-Embedder-Policy`. See above.

## Known risk for the next step
TanStack Start may write small inline scripts when it renders a page. With `script-src 'self'`, the browser would block them and a page could go blank once the headers are attached. The fix is a per-request nonce, which belongs to the attach step. Test on a preview deployment first.

## Known risk
The next step, as documented above, caused a white screen. Steps were taken to avoid this in the future.

## Out of scope
`vercel.json` and route files were not edited. No secrets are in this note.