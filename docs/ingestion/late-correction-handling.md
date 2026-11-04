## Late correction handling

This note records the rule for a late correction, what I asked the coding agent to change, and whether the app now follows that rule. A late correction uses the same idempotency key as an existing event but changes at least one goal detail. It is not an exact retry.

## Source documents
Decision table: docs/ingestion/event-outcome-decision-table.md
Idempotency key: docs/ingestion/idempotency-key-decision.md
Replay promise: docs/ingestion/contract-replay-delta.md
Storage rule: docs/ingestion/storage-rule.md
Implementation review: docs/ingestion/storage-implementation-review.md

## Rule I am applying
Existing idempotency key (copy the key fields already chosen): `providerEventId`, the provider's stable event id.
Late-correction rule from the decision table: The same event stays one event, its stored facts are replaced with the corrected facts, and the stats follow the correction without adding a second goal.
Storage rule: For the same `providerEventId`, changed details replace the previously stored event in its existing row; the app does not insert another goal.
Exact-retry promise: When the same key arrives with unchanged details, the app returns the original `201` success and does not write another row. It may include `replayed: true`.
Correction response: When changed details are applied, the endpoint returns `201` with the corrected event and `corrected: true`, so the provider can tell that the correction was applied.

A late correction must replace the old details for the same event. It must not freeze the original incorrect details or count the goal twice.

## Hockey example
First delivery (wrong details): Player A scored at 12:01.
Correction (same key): Player B scored at 12:01.
Idempotency key: `providerEventId`, with the same provider event id on both deliveries.
Changed detail: The scorer changes from Player A to Player B; the game time remains 12:01.
Corrected scorer: Player B.
Original scorer: Player A no longer has this goal.
Team goal total: One goal.

## Expected versus actual
Check	Expected behavior	Actual behavior after the agent's change	Matches rule?
Original delivery	One goal for Player A is stored.	Code path stores one new provider event row.	Yes
Same-key correction	Stored details change to Player B.	Code path updates the existing row when event facts differ.	Yes
Original scorer	Player A no longer receives this goal.	The stored event now names Player B instead of Player A.	Yes
Corrected scorer	Player B receives this goal.	The corrected event returned by the update names Player B.	Yes
Team total	Team still has one goal.	The existing row is updated; no second event row is inserted.	Yes
Correction response	Provider is told the correction was applied.	The correction response is `201` with `corrected: true`.	Yes
Exact retry	Unchanged details follow the existing replay promise.	The exact-facts branch returns `201` with `replayed: true` and does not update.	Yes

## Decision-table check
Late-correction case: The same event arrives with different facts, so it remains one event, its stored facts change to the corrected version, and no second goal or stat line is added.
Expected storage result: The original details are replaced because the same `providerEventId` identifies the same event while the changed facts identify a correction.
Expected response: The provider receives the corrected event with `201` and `corrected: true`, rather than the unchanged-replay answer.
Does my handling rule match the decision table? Yes. It replaces the details once and keeps the goal count at one.

## Contract replay check
Existing unchanged-replay promise: An unchanged resend gets the original `201` success and the same stored body, does not create a second row, and is not an error.
When that promise applies: It applies only when the same key arrives with unchanged goal details.
How a correction differs: Changed details mean the stored event must be updated, so the response must identify an applied correction instead of implying that nothing changed.

## Newest correction handling
Provider version or sequence number available: None is present in the current event payload or storage schema.
How the app identifies the newest correction: It does not compare provider versions; it updates the existing row when a changed delivery arrives.
If no version or sequence number exists: Latest arrival wins. An older delayed delivery using the same key could overwrite a newer correction, which is a known limitation.

## Agent instructions and changes
First request: inspect current behavior

What I asked the agent:

First inspect the late-correction notes and explain what the app does when the same key arrives with a different scorer, without changing files.

What the agent reported:

The initial storage path treated a same-key delivery with changed facts as a correction path that updates the existing row, rather than freezing the original details or inserting a second goal.

Second request: make the smallest change

What I asked the agent to change:

Keep `providerEventId` as the key; update the existing row only when the stored facts differ, return `corrected: true` for that change, and preserve the exact-replay response with no correction flag for unchanged facts. Do not add a new endpoint, key, migration, or status code.

What the agent reported changing:

The route compares the validated event facts explicitly. It returns the stored event with `replayed: true` for an exact match, and only updates the existing row and returns `corrected: true` when the facts differ.

## Mismatches and fixes
Initial behavior that did not match the rule: The first review found that the correction response did not clearly identify that changed details had been applied, and the exact-fact comparison needed to keep the correction path separate.
What I asked the agent to fix: Add a correction marker while preserving the unchanged replay path, and ensure only different facts cause an update.
What the agent changed: Added explicit fact comparison, kept exact repeats on the no-write replay branch, and returned `corrected: true` only after a changed-facts update.
Later review results: The route review shows the exact replay branch returns `replayed: true` without `corrected`, while the correction branch updates one row and returns `corrected: true`.
Remaining limitations: No provider version or sequence number exists, so an older delayed same-key delivery could overwrite a newer correction.

If the original scorer still has the goal or the team total becomes two, the correction is not working correctly.

## Proof

A corrected goal is stored only once: Yes

The corrected scorer receives the goal: Yes

The original scorer loses the goal: Yes

The team goal total remains one: Yes

The provider receives a response indicating that the correction was applied: Yes

An unchanged retry still follows the existing replay promise: Yes

In plain language:

The application now replaces changed details for the existing `providerEventId`, keeps the corrected goal as one stored event, and tells the provider with `corrected: true`. An unchanged retry remains a no-write replay with `replayed: true`, so the goal is not counted twice.