# Contract replay delta

## Replay promise
When the provider sends the same event again, using the idempotency key named below, the endpoint must:
- Return the original success: the same `201` status and the same response body (`id`, `state: accepted`, `event`) that the first accepted delivery got. An optional `replayed: true` hint may be added to the body. No new status code is invented.
- Not perform a second write: the event is not saved again, so one goal is counted once.
- Not return an error just because the event was already accepted.

Idempotency key name (copied from docs/ingestion/idempotency-key-decision.md, not a new name): `providerEventId`

Decision-table row this promise must match: the exact-duplicate outcome in docs/ingestion/event-outcome-decision-table.md. In my words, that row says: when the same event arrives again with the same facts, stored stats do not change, the goal is not counted twice, and the sender hears that it is already saved.

This note does not decide late corrections, out-of-order storage, partial batches, or outages. Those stay in the decision table.

## Do not change
- Do not add, remove, or rename endpoints.
- Do not change HTTP status codes or the error model from the first Sprint 5 tutorial.
- Do not rewrite validation rules.
- Do not create a second contract file.
- Do not write storage code, SQL, or migrations in this step.
- Do not pick a different idempotency key.

## Smallest contract changes
Existing contract file path (the file already in the repo): `openapi/hockey-ingestion.yaml`

Add only these ideas to that file, as plain descriptions on the existing ingest request and its success response:
1. The request includes the idempotency key named above (`providerEventId`, already a required field).
2. If that key was already accepted, the response is the original success again (`201`, same body).
3. A replay does not create another stored event.

Wording-only side effect: the description of the existing 409 response was narrowed so it no longer covers an exact replay. Its status number was not changed.

## Review of the agent's edit
- Contract file edited: openapi/hockey-ingestion.yaml
- What changed, in one or two sentences: Added a description saying a repeated providerEventId returns the original 201 and stores nothing new, reworded the 201 and 409 descriptions to match, and added an optional `replayed` boolean to the success body.
- Did the edit add a second contract file? no
- Did the edit rewrite endpoints, status codes, or validation? no
- Does the edit say a replay returns the original success and does not write a second time? yes
- Does that match the exact-duplicate row of the decision table? yes
- If any answer was wrong, what you told the agent to fix: nothing to fix

## Follow-up for a later step
docs/api/error-and-status-model.md still describes a duplicate provider event id as a 409. That wording now disagrees with this promise and should be updated when the error model is next revised. The handlers do not store anything yet, so replay is a promise in the contract, not running behavior.