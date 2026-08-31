Decisions log — Sprint 1
D1 — Route structure
Decision: Separate directory pages from individual player pages.
Choice: Static routes for home, Players, and Games, with a dynamic /players/$playerId route for individual players.
Why: Staff need simple directory pages plus stable links they can bookmark and share. See docs/route-map.md.
D2 — Player ID validation
Decision: Validate player IDs before loading player details.
Choice: Use the shared player-parameter validation helper.
Why: Invalid player links should produce a predictable result instead of causing unexpected behavior.
D3 — Search parameter validation
Decision: Keep supported filters and views in the URL.
Choice: Validate search parameters with shared schemas.
Why: URL filters can be refreshed or shared while invalid values receive a safe fallback.
D4 — Server-rendered first load
Decision: Show directory content on the initial page load.
Choice: Use server loaders with the current seed data.
Why: Staff should see useful content immediately instead of waiting for client-side data loading. See docs/ssr-verification-notes.md.
D5 — Navigation
Decision: Use shared navigation between the main directory areas.
Choice: Keep Home, Players, and Games available through the shared app navigation.
Why: Staff can move between the main jobs of the directory without manually entering URLs.
D6 — Empty and not-found states
Decision: Handle missing player records explicitly.
Choice: Show a clear not-found or empty message.
Why: An invalid or missing player should result in useful feedback instead of a broken or blank page.
D7 — Sprint 1 technology baseline
Decision: Use the project stack established during scaffolding.
Choice: TanStack Start with React, TypeScript, Vite, and Tailwind.
Why: It supports the routing and server-rendered first-load requirements while leaving a clear path toward Supabase, TanStack Query, and Vercel. See docs/scaffold-notes.md.
Explicit non-goals for Sprint 1
Live Supabase data
Supabase Auth
Vitest/Playwright automated testing
Production Vercel deployment