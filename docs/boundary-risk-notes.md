# Boundary risk notes — Hockey Operations Directory (Sprint 2, Topic 1)

## Client story

The directory needs to read real player and staff data from Supabase, but privileged Supabase credentials must stay on the server so they are never sent to a user's browser or included in browser JavaScript.

## What might naively run in the client (risks)

- A React component or route could create a Supabase client with a service-role key. Anyone using the site could then inspect the key in browser tools.
- A secret could be placed in a Vite client-exposed environment variable such as `VITE_SERVICE_ROLE_KEY`. Vite makes `VITE_*` values available to browser code.
- Client-side `fetch` or effect code could make privileged Supabase requests with an embedded secret. The request and the secret could be visible in browser network tools or bundled JavaScript.
- A shared client/server module could accidentally import server secrets into the browser dependency graph, even when the importing component does not use the secret directly.
- Secrets could be logged to the browser console or returned in a browser payload, exposing them through developer tools, error reports, or saved network responses.

## What must move server-side

- Supabase service-role credentials and any other secret credentials must be loaded and used only on the server.
- Privileged orchestration for directory reads, including deciding what Supabase data to request and how to handle read errors, must run on the server.
- Construction of the server-only Supabase client must happen in a server-only module and must use secret environment variables there.
- Server-side environment loading for secret variables must be kept separate from Vite client-exposed configuration. Secret values must not use a `VITE_*` name or cross a browser-facing import boundary.

## What may stay in the client

- Directory presentation and other UI rendering.
- Filters and other UI state that control what the user sees.
- Loading and empty states.
- Calling a TanStack Start server function for directory data.
- Rendering the data returned by that server function, provided the response contains only data the browser is meant to receive.
- Intentionally public configuration, if applicable, such as a public Supabase URL or another value explicitly approved for browser use. Public configuration is not a replacement for secret credentials.

## Success criteria for this tutorial (checklist)

- [ ] A teammate can inspect the environment-variable documentation and `.env.example` and confirm that public browser variables are separated from secret server variables, with no real secret values present.
- [ ] A teammate can identify a server-only Supabase client in a server-only module and verify that it uses `SERVICE_ROLE_KEY` or the team's documented secret equivalent.
- [ ] A teammate can identify a TanStack Start server function that performs directory reads and verify from the client/server code that the browser calls that function rather than importing or using the service-role credential directly.
- [ ] A teammate can identify pure directory mapper and filter helpers that are separated from Supabase and other I/O.
- [ ] Vitest is configured in the project, and mapper tests verify representative directory data and edge cases without requiring a live Supabase connection.
- [ ] Handoff documentation identifies the next topic, the files or boundaries it should continue from, and any unresolved decisions recorded during this topic.

## Out of scope for this topic (do not solve here)

Keep this topic focused on the client/server boundary for Supabase-backed directory reads. Do not expand it into a full authentication redesign, Playwright E2E testing, or unrelated production hardening.

## Open questions to resolve in later steps

- What exact input and output contract should the TanStack Start server function use for directory reads?
- Which player and staff fields may be returned to the browser, and which fields must remain server-side?
- What are the team's final environment-variable naming conventions for public Supabase configuration and secret server credentials?
- Where should the server-only Supabase client and pure mapper/filter helpers live in the project?
- What handoff format and acceptance test expectations should the next topic use?
