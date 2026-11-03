# Storage implementation review

Checked against:
- docs/ingestion/storage-rule.md
- docs/ingestion/event-outcome-decision-table.md
- docs/ingestion/idempotency-key-decision.md
- docs/ingestion/contract-replay-delta.md

I directed a coding agent. I did not write the storage code or SQL myself.

## What the agent changed
- Files touched: src/routes/api/events.ts and supabase/migrations/20261103120000_provider_events.sql
- In plain words: after validation, the events route looks up the provider event id. A new id is saved as one row. A repeated id with the same facts returns the stored event. A repeated id with changed facts updates that one row. A failed save returns an error response.

## Prompt and refine log
- First instruction I gave: implement storage for POST /api/events only, with a unique provider event id, no second insert on a replay, and no success reply on a failed write. Do not edit the four rule notes or the contract.
- What failed on the first pass: the live replay check did not show the optional hint, and the correction response had no correction marker.
- Refine instruction I gave: asked the agent to make a correction reply say the correction was applied; the agent added `corrected: true` to that response.

## Key check
- Idempotency key the storage uses: provider_event_id, filled from providerEventId
- Key I already chose: providerEventId
- Match: pass
- Required fix if fail: none

## Replay return check
- What a replay must return: the original success, the same 201 and body, with an optional replayed hint
- What the implementation returns on a replay: the stored id and event body with `201` and the optional `replayed: true` hint.
- Match: pass. The contract marks the hint as optional.
- Required fix if fail: none

## Exact duplicate
- Expected outcome: stats do not change, the goal is not counted twice, and the sender hears it is already saved.
- What the implementation does: returns the stored event and inserts nothing.
- Evidence (agent): "Exact duplicate: returns the stored event with `201` and `replayed: true`. No second row is inserted."
- Evidence (stored result): the table held one row, "evt-1 | a4c9d120-829c-4957-a01f-9acf81077f6f".
- Does a second delivery insert a second stat: no
- Result: pass
- Re-check after fix: not needed

## Out-of-order arrival
- Expected outcome: a new late event is saved and kept, and nothing stored is deleted.
- What the implementation does: a new provider event id inserts one row regardless of arrival order.
- Evidence (agent): "Out-of-order new ID: stores the late event normally. One row is inserted."
- Evidence (stored result): after evt-1 at 12:34, evt-2 at 08:00 was stored as its own row, "6aba2f70-35b9-4da8-8c43-791847e6a895 | evt-2".
- Result: pass
- Re-check after fix: not needed

## Partial batch
- Expected outcome: each new valid event is saved once, none are undone, and the sender is told which saved and which did not.
- What the implementation does: the contract takes one event per request, so a group arrives as separate requests. Each is validated and saved on its own, a failed one gets its own 422 naming the field, and a resend of a saved one returns the stored event.
- Evidence (agent): "No batch endpoint was added." The route accepts one event per request, so separate requests can be judged independently, but it does not return a batch list of saved and unsaved event ids.
- Limit: sending many events in one request is not supported.
- Result: fail for the decision-table batch outcome; no batch endpoint or batch result list exists in this scope.
- Required fix: define and implement a batch contract before claiming the partial-batch outcome is covered.
- Re-check after fix: required if batch support is added

## Late correction
- Expected outcome: one event, facts updated, no second row, and the sender is told the correction was applied.
- What the implementation does: updates the existing row for the same id and returns the body with `corrected: true`.
- Evidence (agent): "Late correction with the same ID: updates the existing stored event. No second row is inserted."
- Evidence (agent): "Late correction with the same ID: updates the existing stored event. No second row is inserted." The route's correction branch returns `201` with `corrected: true`.
- Result: pass on storage and reply
- Required fix: none
- Re-check after fix: pass

## Provider outage
- Expected outcome: nothing is invented, unsaved events are absent, and the sender is told "not saved."
- What the implementation does: a failed write returns a 500 error response, never the replay success.
- Evidence (agent): "Failed write/outage: returns a `500` error response and never reports success. No second row is inserted."
- Evidence (agent): "Failed write/outage: returns a `500` error response and never reports success. No second row is inserted."
- Result: pass
- Re-check after fix: not needed

## Final verdict
- All implemented cases, the key check, and the replay-return check are pass: yes. Partial batch remains an explicit fail/out-of-scope gap because this endpoint accepts one event at a time and has no batch result contract.
- Safe for coaches to trust stored stats from this storage path: no, not until the open fixes below are closed
- Open fixes still required:
  - batch handling when a batch endpoint exists
  - a 500 response is used but is not in the contract or the error model
  - the service-role key is also used by app/server/directory.ts, which conflicts with docs/access/service-role-key-rule.md
  - the endpoint does not yet check who is sending
  - the outage case was not live-tested