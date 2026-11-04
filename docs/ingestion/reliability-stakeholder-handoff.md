# Reliability handoff: one goal stays one stat

## Who this is for

This handoff is for the coach liaison, the instructor, and the next person building on this sprint. It is written so a reader who does not open every working note can understand the reliability rules.

## The coach-trust problem

A provider timeout, delayed delivery, or correction can cause the same real event to arrive more than once or in a changed form. One real goal must stay one stored stat; a double-counted goal can make the score and player totals wrong and damage coach trust. Source: docs/ingestion/duplicate-delivery-impact.md.

A second delivery of the same goal does not increase the stored stat when it uses the same event key and the same facts.

## Decisions already made

| Decision | What we decided, in plain words | Source file |
| --- | --- | --- |
| Why a second delivery matters | A timeout can make the provider retry one real goal, and messages can arrive out of order; storing every delivery as a new event can double-count a goal. | docs/ingestion/duplicate-delivery-impact.md |
| Exact duplicate | The same event with the same facts does not change stats, does not create a new event, and is answered as an already-saved success. | docs/ingestion/event-outcome-decision-table.md |
| Out-of-order arrival | A new event is saved even when it arrives after a later game moment; it is not rejected or used to delete an existing event. | docs/ingestion/event-outcome-decision-table.md |
| Partial batch | Each valid event is judged and saved on its own; saved events remain saved when a neighboring event fails, failed events stay out of stats, and a resend does not duplicate already saved events. | docs/ingestion/event-outcome-decision-table.md |
| Late correction | A same-key event with changed facts remains one event; its stored facts are replaced, the stats follow the correction, and no second goal is added. | docs/ingestion/event-outcome-decision-table.md |
| Provider outage | Missing events are not invented and failed writes are not reported as success; a later resend of a missing event is saved once. | docs/ingestion/event-outcome-decision-table.md |
| What makes two deliveries the same event | The provider's stable `providerEventId` identifies the event. The same key remains the same event even when changed details reveal a correction. | docs/ingestion/idempotency-key-decision.md |
| What a replayed request returns | An unchanged replay returns the original `201` success with the same stored id and event body, is not an error, and does not write a second copy; `replayed: true` may be included. | docs/ingestion/contract-replay-delta.md |
| How storage treats a repeated event | One `providerEventId` maps to one stored event. Exact repeats do not write; changed facts update the existing event; failed writes return an error rather than replay success. | docs/ingestion/storage-rule.md |
| Whether storage matched the table | The review records passing key, duplicate, out-of-order, partial-delivery, correction, and outage behavior for the implemented one-event endpoint, while noting separate follow-ups outside this grade. | docs/ingestion/storage-implementation-review.md |
| What the replay comparison showed | The later run passed the exact duplicate and out-of-order cases: `pk-101` stayed one unchanged row with `replayed: true`, and the late `pk-102` event was stored. | docs/ingestion/replay-comparison.md |
| How a corrected event with the same key is handled | Changed facts update the existing row and return `201` with `corrected: true`; unchanged facts stay on the replay path with `replayed: true`. | docs/ingestion/late-correction-handling.md |
| What the provider may safely retry | Timeout, exact-duplicate, and outage retries are safe only when the provider reuses the same `providerEventId` and the same body. A new id can double-count, and an old body after correction can restore stale details. | docs/ingestion/provider-retry-note.md |

## Consistency pass

Checked all nine files above in this session.

The stored-outcome rules agree: the decision table wins, and every duplicate keeps one goal. The idempotency key is consistently `providerEventId`. The storage rule, late-correction note, and replay comparison agree that exact facts take the no-write replay path while changed facts update the one stored event.

One historical wording clash remains documented rather than hidden: the follow-up paragraph in docs/ingestion/contract-replay-delta.md still describes the pre-fix state in which a late correction lacked a correction marker, while docs/ingestion/late-correction-handling.md and the later replay comparison record the fix as `corrected: true`. The current correction rule follows the later correction note and observed replay result; the contract's main unchanged-replay promise is unaffected.

The replay comparison also records a prediction-label slip about which named player was the late event. That is a documentation mistake, not a disagreement about duplicate or out-of-order storage.

## Open questions

- The partial-batch decision describes a batch result list, but the implemented endpoint accepts one event per request; a future batch contract would need to define that response.
- The correction path has no provider version or sequence number, so latest arrival wins and an older delayed same-key delivery could overwrite a newer correction. Source: docs/ingestion/late-correction-handling.md.
- The storage review records that the 500 write-error response is not yet in the contract/error model and that sender authentication and a service-role usage conflict remain follow-ups. Source: docs/ingestion/storage-implementation-review.md.
- The historical correction wording in docs/ingestion/contract-replay-delta.md should be reconciled in a future documentation pass; this handoff does not silently rewrite it.

## What the next topic must reuse, not redo

- Do not rebuild the ingestion endpoint, the HTTP status codes and error model, the OpenAPI contract, or server-side validation from the first Sprint 5 tutorial.
- Do not re-choose the `providerEventId` idempotency key, the unchanged-replay promise, the storage rule, the late-correction rule, or the provider retry note recorded above.
- Do not create a new repository or a new hosting project. Reuse the repository and hosting project this app already has.
- Do not change the key, replay promise, correction rule, or retry note without updating this handoff and the relevant source decision.

## What this handoff does not decide

This file adds no new key, reply, or storage behavior. It records the decisions and evidence already present in the nine source notes; it does not add code, SQL, a migration, or a new policy.
