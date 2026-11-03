# Storage rule for hockey events

This file is a plain-language instruction for a later coding-agent step.
It is not SQL, not a migration, and not application code.

## Sources this rule must match

- Decision table: docs/ingestion/event-outcome-decision-table.md
- Idempotency key: docs/ingestion/idempotency-key-decision.md
- Replay promise: docs/ingestion/contract-replay-delta.md

If a sentence here disagrees with those files, this file is wrong.

## The key

- Chosen idempotency key: `providerEventId`, the provider's own stable id for the event.
- Rule: one value of `providerEventId` maps to one stored event. A second delivery with the same `providerEventId` is not a new event.

## Exact replay

- When the same `providerEventId` arrives again and the event is the same: do not insert again. Do not add the goal or the stat again.
- What the replayed request returns (from the contract replay delta): the original success. That is the same `201` status and the same body (`id`, `state: accepted`, `event`) as the first accepted delivery, with an optional `replayed: true` hint. It is not an error.
- That return is not a second save. The event is already stored.

## Out of order

- If an event arrives late and its `providerEventId` is new: keep it. Do not drop it only because it arrived after a later event. For example, a minute-8 goal arriving after a minute-12 goal is saved.
- Stats come from stored events, not from the order deliveries arrived.
- Outcome from the decision table: a new late event is saved and included in coach stats. It is not rejected for being late, and nothing already stored is deleted. If it turns out to be the same event we already saved, it is treated as an exact duplicate.

## Partial batch and outage

- Partial batch outcome from the decision table: each new valid event is saved once, judged on its own. Events already saved stay saved even if a neighbor failed. Events that did not save are not in the stats. The reply must list which events saved and which did not, and must never call the whole batch a success when some events were not stored. Resending the whole group must not add a second copy of anything that already saved.
- Failed write or provider outage: do not report success. Outcome from the decision table: missing goals are never invented, anything not saved is absent from the stats, and the sender is told "not saved." A later resend of a missing event is stored once.
- How this differs from an exact replay: a replay is for an event that really is stored, so returning the original success is true and lets the provider stop retrying. A failed write means the event is not stored, so it must not get that success reply. If it did, the provider would stop retrying and the goal would be lost.

## Late correction (one sentence only)

- Per docs/ingestion/event-outcome-decision-table.md: the event stays one event, its stored facts change to the corrected version, the stats follow the correction, and no second goal or stat line is added.

## What a later implementation must not do

- Do not invent a different idempotency key.
- Do not invent a different replay response.
- Do not insert a second copy of an exact replay.
- Do not report success when the write did not succeed.
- Do not turn this note into SQL.