# Server Function Contract

## 1. Purpose

This document defines the boundary between the browser directory UI and the server-side directory read for the Hockey Operations Directory.

The browser sends ordinary filter values to a TanStack Start server function. The server validates those values, performs the privileged Supabase read, maps database rows to approved display data, and returns JSON-safe data for the UI. The browser never constructs the privileged Supabase client and never receives a service key.

This contract is intentionally small. It gives the implementer stable field names and error behavior without exposing the database schema as a browser API.

## 2. Function identity

- Suggested export name: `getDirectoryEntries`
- Future module path: `app/server/directory.ts`
- Boundary: TanStack Start server function called by browser-facing loaders or components
- Request: one object containing `search`, `role`, and `limit`
- Response: one of the success or error shapes below

The future implementation may use another internal Supabase query name, but the browser-facing function should preserve this contract.

## 3. Inputs

The function accepts an object with these properties. Missing values use the stated defaults.

| Field | Type | Default | Validation and behavior |
| --- | --- | --- | --- |
| `search` | `string` | `''` | Optional. Trim surrounding whitespace. An empty value means no text filter. Reject values longer than 100 characters with `VALIDATION`; do not silently pass an unbounded string to the query. Search is case-insensitive and may match the approved `name` and `team` display fields. |
| `role` | `'player' \| 'staff' \| 'all'` | `'all'` | Optional. Accept only these exact values. Any other value, including a client-supplied database table or column name, returns `VALIDATION`. |
| `limit` | `number` | `25` | Optional. Must be an integer from 1 through 100 inclusive. Reject decimals, `NaN`, infinity, zero, negatives, and values above 100 with `VALIDATION`. The server must enforce this maximum even if the UI already limits the control. |

The validated request should be normalized before querying: trim `search`, preserve the canonical role value, and use the bounded integer `limit`. Unknown input properties are ignored; they must not alter the query or select additional fields.

A representative request is:

```ts
{
  search: 'Mercer',
  role: 'player',
  limit: 25,
}
```

## 4. Success output

A successful response has `ok: true` and contains only fields the directory UI is allowed to render:

```ts
type DirectoryEntry = {
  id: string
  name: string
  role: 'player' | 'staff'
  position: 'F' | 'D' | 'G' | null
  number: number | null
  team: string
  status: 'active' | 'ir' | 'inactive'
}

type DirectorySuccess = {
  ok: true
  entries: DirectoryEntry[]
}
```

Field rules:

- `id` is the stable public identifier used for links and React keys. It must be a non-empty string.
- `name` is the display name and must be a non-empty string.
- `role` distinguishes `player` from `staff`.
- `position` uses the existing player values `F`, `D`, or `G`; staff entries use `null`.
- `number` is the jersey number for players or `null` for staff. It must be a number when present.
- `team` is the display team name and must be a string. It may be empty only if the product explicitly supports unassigned staff.
- `status` is the display lifecycle state. Current player data uses `active` and `ir`; `inactive` is reserved for staff or future directory records.

Example success object:

```json
{
  "ok": true,
  "entries": [
    {
      "id": "42",
      "name": "Alex Mercer",
      "role": "player",
      "position": "F",
      "number": 42,
      "team": "Toronto",
      "status": "active"
    },
    {
      "id": "staff-12",
      "name": "Morgan Lee",
      "role": "staff",
      "position": null,
      "number": null,
      "team": "Toronto",
      "status": "active"
    }
  ]
}
```

An empty result is still a successful response: `{ "ok": true, "entries": [] }`.

## 5. Error shapes

Errors use a discriminated `ok: false` response. The `code` is safe for UI logic and logging classification. `message` is a short, user-safe message and must not contain SQL, raw Supabase errors, environment values, credentials, or row data.

```ts
type DirectoryErrorCode =
  | 'VALIDATION'
  | 'UPSTREAM'
  | 'INTERNAL'

type DirectoryError = {
  ok: false
  code: DirectoryErrorCode
  message: string
}

type DirectoryResponse = DirectorySuccess | DirectoryError
```

Use the codes as follows:

- `VALIDATION`: the request does not satisfy the input rules. No Supabase read should occur.
- `UPSTREAM`: Supabase or another directory data provider failed or returned an unusable result. Do not expose the provider's raw message.
- `INTERNAL`: an unexpected server-side failure occurred while validating, mapping, or assembling the response.

Example validation error:

```json
{
  "ok": false,
  "code": "VALIDATION",
  "message": "limit must be an integer from 1 to 100"
}
```

The function should return the same response shape for expected failures rather than leaking thrown provider exceptions to the browser. Unexpected failures may be logged on the server only after removing secrets and sensitive row data.

## 6. Pure logic vs I/O split

Keep the implementation in two clearly separated layers.

**Pure, testable logic** may include:

- Validating and normalizing `search`, `role`, and `limit`.
- Mapping a raw player or staff row into the exact `DirectoryEntry` shape.
- Applying an in-memory filter when that is needed for a mapper test or a non-Supabase data source.
- Converting known internal failures into safe error codes.

These helpers accept ordinary values and return ordinary values. They must not import the Supabase server client, read environment variables, log secrets, or depend on request context.

**Server-only I/O and orchestration** belongs in `app/server/directory.ts` and server-only modules:

1. Validate the request using the pure input validator.
2. Construct or obtain the server-only Supabase client.
3. Select only the database columns needed to build `DirectoryEntry`.
4. Apply the validated role, search, and limit to the privileged read where practical.
5. Map rows through the pure mapper.
6. Return only `DirectorySuccess` or `DirectoryError`.

Supabase calls, service-role environment loading, and raw database rows must never be imported into React components, browser loaders, or shared client modules. Mapper tests should run with representative in-memory rows and must not require a live Supabase connection.

## 7. Boundary rules

- The service-role key and every other secret credential remain server-only.
- A service key must never be returned in `DirectoryEntry`, an error `message`, logs sent to the browser, serialized loader data, or a client bundle.
- Secret environment variables must not use a `VITE_*` name and must not be imported across a browser-facing boundary.
- The browser calls `getDirectoryEntries`; it does not construct a privileged Supabase client or query Supabase directly with service credentials.
- The server selects or maps an allowlist of fields. It must not serialize raw Supabase rows by default.
- Database column names, query text, provider status details, tokens, passwords, and internal stack traces are server-side details.
- Public configuration, such as an approved public Supabase URL, does not make a service credential public or replace the server function.

## 8. Non-goals

This contract does not define:

- Authentication, authorization, user roles, or an administration workflow.
- Create, update, delete, import, or bulk-edit operations.
- Pagination cursors, sorting, exports, or analytics.
- A public Supabase schema, table name, RPC name, or database migration.
- A complete staff data model beyond the fields needed by the directory UI.
- Client-side access to Supabase using a service role or any other privileged credential.
- Authentication redesign, Playwright end-to-end coverage, or unrelated production hardening.

Add those concerns in a separate decision and contract instead of expanding this function implicitly.

## 9. Acceptance checks for implementers (Step 7+)

An implementation is ready for review when all of these checks pass:

- [ ] The exported server function is named `getDirectoryEntries` or has a documented equivalent that preserves this request and response contract.
- [ ] The server function accepts `search`, `role`, and `limit`, applies the documented defaults, and rejects invalid values before any Supabase call.
- [ ] `limit` is enforced server-side at 1 through 100, regardless of browser input.
- [ ] The success response is discriminated by `ok: true` and every entry has exactly the approved `DirectoryEntry` fields and types.
- [ ] An empty match returns `ok: true` with an empty `entries` array.
- [ ] Expected validation, upstream, and unexpected failures produce `ok: false` with a safe code and no raw provider details.
- [ ] Pure validation and mapper helpers can be unit-tested with in-memory data and do not import Supabase or secret environment configuration.
- [ ] Supabase client construction and privileged reads are in server-only modules, and browser code calls the server function rather than using a service key.
- [ ] A repository search finds no `SERVICE_ROLE_KEY`, database password, or other secret in browser-facing code, returned payloads, or committed examples.
- [ ] Tests cover at least one player mapping, one staff mapping with nullable player fields, an empty result, each invalid input category, and an upstream failure.
- [ ] The implementation does not add unrelated authentication, mutation, pagination, or schema work.
