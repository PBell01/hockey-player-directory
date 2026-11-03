# Acceptance Criteria: Hockey Event Ingestion and Evaluation Forms

## How to read these cases
Each case uses Given / When / Then. Nothing here is invented: paths, fields, and statuses come from the contract and the server schemas.

- Contract: `openapi/hockey-ingestion.yaml`
- Routes: `src/routes/api/events.ts`, `src/routes/api/evaluations.ts`
- Schemas: `src/server/validation/event-payload.ts`, `src/server/validation/evaluation-payload.ts`
- Errors: `src/server/validation/field-errors.ts`

Status note: the contract uses **422** for field failures and **400** only for unusable requests. The contract path is `/events`. The routes serve it at `/api/events`.

## Provider: ingest a hockey event

### AC-1: Valid event is accepted
- Given: an event with `providerEventId`, `gameId`, `eventType`, `period`, and `clockTime` as non-blank strings
- When: `POST /events` (served at `/api/events`) is sent with that body
- Then: the response is `201`, and the body has `id`, `state` of `accepted`, and `event`

### AC-2: Missing required event fields are rejected
- Given: an event with no `period`
- When: `POST /events` is sent with that body
- Then: the response is `422` with `VALIDATION_FAILED`
- And: `details` has an entry with field `period`, code `REQUIRED`, and a message

### AC-3: Wrong types on event fields are rejected
- Given: an event where `clockTime` is the number `1234`
- When: `POST /events` is sent with that body
- Then: the response is `422`
- And: `details` has an entry with field `clockTime` and code `INVALID_TYPE`

### AC-4: Structured field errors for events
- Given: any invalid event from AC-2 or AC-3
- When: the server rejects it
- Then: every `details` item has `field`, `code`, and `message`, each a string, not a single unlabeled sentence

## Coach: submit an evaluation form

### AC-5: Valid evaluation is accepted
- Given: an evaluation with `playerId`, `practiceDate` "2026-10-20", and `ratings` of `{ "skating": 4 }`
- When: `POST /evaluations` (served at `/api/evaluations`) is sent with that body
- Then: the response is `201`, and the body has `id`, `state` of `submitted`, and the evaluation fields

### AC-6: Missing required evaluation fields are rejected
- Given: an evaluation with no `practiceDate`
- When: `POST /evaluations` is sent with that body
- Then: the response is `422`
- And: `details` has an entry with field `practiceDate` and code `REQUIRED`

### AC-7: Wrong types on evaluation fields are rejected
- Given: an evaluation where `ratings.skating` is the string "high"
- When: `POST /evaluations` is sent with that body
- Then: the response is `422`
- And: `details` has an entry with field `ratings.skating` and code `INVALID_TYPE`

### AC-8: Structured field errors for evaluations
- Given: any invalid evaluation from AC-6 or AC-7
- When: the server rejects it
- Then: the body uses the same `field`, `code`, and `message` item shape as events

## Cross-cutting: the server is the authority

### AC-9: Client-side checks are not enough
- Given: a payload that carries a client flag such as `isValid: true` but is missing a required field
- When: it reaches `POST /events` or `POST /evaluations`
- Then: the server still runs the schema and rejects it
- And: both route files import and call their validator, so invalid input never reaches the `201` path

## Traceability

| Case | OpenAPI path + method | Validation module | Test name |
| --- | --- | --- | --- |
| AC-1 | POST /events | event-payload.ts | AC-1 valid event is accepted |
| AC-2 | POST /events | event-payload.ts | AC-2 missing period is rejected |
| AC-3 | POST /events | event-payload.ts | AC-3 wrong type clockTime is rejected |
| AC-4 | POST /events | field-errors.ts | AC-4 event errors use field, code, message |
| AC-5 | POST /evaluations | evaluation-payload.ts | AC-5 valid evaluation is accepted |
| AC-6 | POST /evaluations | evaluation-payload.ts | AC-6 missing practiceDate is rejected |
| AC-7 | POST /evaluations | evaluation-payload.ts | AC-7 wrong type rating is rejected |
| AC-8 | POST /evaluations | field-errors.ts | AC-8 evaluation errors use field, code, message |
| AC-9 | both POST paths | route handlers + schemas | AC-9 server validates despite client flags |