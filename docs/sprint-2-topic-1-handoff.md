Sprint 2 · Topic 1 Handoff — Server Functions, Secret Hygiene, First Vitest Suite
1. Summary (what shipped)

Sprint 2 Topic 1 established and verified the server boundary for the Hockey Operations Directory.

Directory reads for the Hockey Operations Directory go through the TanStack Start server function getDirectoryEntries in app/server/directory.ts.

Privileged Supabase access is centralized in the server-only module app/lib/supabase.server.ts.

Public and server-only environment variables are separated through .env.example and app/config/env.ts.

Pure directory mapping logic lives in app/lib/directory/mappers.ts.

Mapper behavior is covered by app/lib/directory/mappers.test.ts.

The /directory route loads directory data through the server function and renders mapped results.

A local Supabase project and directory_entries table were configured for runtime verification.

The directory route successfully loaded local directory data.

Browser Network inspection did not show service-role or other secret key material in client-visible traffic observed during verification.

No authentication, mutations, RPCs, workflows, or Playwright/E2E coverage were implemented in this topic.

2. Boundary decisions (keep these stable)
Concern	Decision	Where it lives
Who talks to Supabase with privileged credentials	Server only	app/lib/supabase.server.ts, app/server/directory.ts
What the browser is allowed to know	Public environment configuration may be client-visible; service-role credentials remain server-only	.env.example, app/config/env.ts, app/routes/directory.tsx
What is unit-tested in isolation	Pure directory row-to-entry mapping	app/lib/directory/mappers.ts, app/lib/directory/mappers.test.ts
Contract for the load path	Validated search, role, and limit inputs with safe success/error results	docs/server-function-contract.md, app/server/directory.ts
Database access path	Browser requests approved directory data through the server function; the server performs the privileged Supabase read	app/routes/directory.tsx → app/server/directory.ts → app/lib/supabase.server.ts

The intended flow is:

browser directory route -> getDirectoryEntries -> server-only Supabase client -> safe mapped result

3. Secret hygiene proof

 .env.example lists required variables by name with empty values only; no real secrets are committed.

 The server-only credential is SUPABASE_SERVICE_ROLE_KEY and is not given a VITE_ prefix.

 app/lib/supabase.server.ts reads the server-only credential through app/config/env.ts.

 app/routes/directory.tsx does not directly use the server-only Supabase client or service-role credential.

 The local directory route loads successfully after the local Supabase environment and directory data were configured.

 Browser DevTools Network inspection showed no service-role or other secret key material in the client-visible requests/responses observed during verification.

 The real .env file is protected by .gitignore and was not copied into this handoff.

Proof notes

Environment review: .env.example contains VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY. The first two are documented as public; the service-role credential is documented as server-only.

Server boundary: app/lib/supabase.server.ts imports publicEnv and serverEnv from app/config/env.ts and constructs the privileged client using the server-only credential. Its file comment explicitly prohibits browser imports.

Route review: The directory UI uses the server-function path rather than constructing a privileged Supabase client in the browser.

Directory route checked: http://localhost:3000/directory

Network observation: After loading the directory route in browser DevTools, no service-role or secret key strings were observed in the Network panel.

Tests: npm test completed successfully with 1 test file and 6 passing tests.

4. Test status

Vitest configuration: vitest.config.ts

Suite path: app/lib/directory/mappers.test.ts

Result at handoff time: PASS

Test files: 1 passed

Tests: 6 passed

Behaviors protected by the mapper suite:

Active player rows map to the expected directory entry fields.

Staff rows map correctly and an unrecognized position/title becomes position: null.

Numeric-string jersey numbers are converted to numbers.

Invalid jersey numbers become number: null.

Null team names become an empty team string.

Inactive rows produce status: 'inactive'.

No Supabase connection or network access is required by the mapper tests.

5. Leftover risks / known gaps

 Authentication and authorization are not implemented. The server boundary exists, but access policy for future privileged directory reads still needs to be established.

 Supabase RPCs and richer server workflows are not wired yet.

 No full end-to-end Playwright coverage is claimed.

 The current local database contains development/test directory data rather than a production data-management workflow.

 Production environment/deployment configuration still needs to be verified separately from local development.

 The current directory server function is a read-only slice; mutations, approvals, exports, and other operational workflows are out of scope.

6. What rolls into the next Sprint 2 topic

Recommendation: Auth-aware loads.

The next topic should establish authentication and authorization at the server-function boundary before expanding privileged directory access. The current server-only Supabase client and getDirectoryEntries function provide the boundary where session/role checks can be added without moving credentials into browser-facing code.

The next reader should continue from:

app/server/directory.ts

app/lib/supabase.server.ts

app/config/env.ts

docs/server-function-contract.md

The pure mapper tests should remain independent of authentication and database access.

7. File map for the next reader
Path	Role
docs/boundary-risk-notes.md	Records the client/server boundary risks and success criteria
docs/client-vs-server-inventory.md	Separates browser-safe responsibilities from server-only responsibilities
docs/server-function-contract.md	Defines the directory server-function inputs, outputs, errors, and boundary contract
.env.example	Documents public and server-only environment variable names without real values
app/config/env.ts	Provides typed public and server-only environment access
app/lib/supabase.server.ts	Constructs the server-only Supabase client
app/server/directory.ts	Owns the directory server function, validation, query, mapping, and safe errors
app/routes/directory.tsx	Directory UI route that loads data through the server function
app/lib/directory/mappers.ts	Pure raw directory-row to UI-entry mapping
app/lib/directory/mappers.test.ts	Vitest coverage for observable mapper behavior
vitest.config.ts	Configures Vitest discovery
8. Stakeholder one-liner

The Hockey Operations Directory now loads real directory data through a verified server-side path with privileged Supabase credentials kept out of the browser and a six-case mapper test safety net; the next Sprint 2 topic should add auth-aware access at that server boundary.