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
- What failed: the agent reported the replay returns `replayed: true`, but my live test showed the hint is absent. Separately, a late correction gets the same reply as a first accept.
- Refine instruction I gave: asked the agent to make a correction reply say the correction was applied (see Open fixes).

## Key check
- Idempotency key the storage uses: provider_event_id, filled from providerEventId
- Key I already chose: providerEventId
- Match: pass
- Required fix if fail: none

## Replay return check
- What a replay must return: the original success, the same 201 and body, with an optional replayed hint
- What the implementation returns on a replay: the same id and body as the first accept. The optional replayed hint is absent.
- Match: pass. The contract marks the hint as optional.
- Required fix if fail: none

## Exact duplicate
- Expected outcome: stats do not change, the goal is not counted twice, and the sender hears it is already saved.
- What the implementation does: returns the stored event and inserts nothing.
- Evidence: I sent the same evt-1 event twice. Both replies carried id a4c9d120-829c-4957-a01f-9acf81077f6f, and the provider_events table held one row.
- Does a second delivery insert a second stat: no
- Result: pass
- Required fix if fail: none
- Re-check after fix: not needed

## Out-of-order arrival
- Expected outcome: a new late event is saved and kept, and nothing stored is deleted.
- What the implementation does: a new provider event id inserts one row regardless of arrival order.
- Evidence: I sent evt-2 with clockTime 08:00 after evt-1 at 12:34. The table then held both rows, evt-1 and evt-2.
- Result: pass
- Required fix if fail: none
- Re-check after fix: not needed

## Partial batch
- Expected outcome: each new valid event is saved once, none are undone, and the sender is told which saved and which did not.
- What the implementation does: not applicable. No batch endpoint exists.
- Evidence: the agent confirmed no batch route exists.
- Result: not applicable, left open
- Required fix if fail: handle batches when a batch endpoint is designed
- Re-check after fix: not needed

## Late correction
- Note: this checks only what the storage rule says.
- Expected outcome: one event, facts updated, no second row, and the sender is told the correction was applied.
- What the implementation does: updates the existing row for the same id and replies with the updated event.
- Evidence: I resent evt-1 with clockTime 12:35. The table still held one evt-1 row, now showing 12:35, and its updated_at changed.
- Result: fail on the reply, pass on storage. The reply is the same as a first accept and never says the correction was applied.
- Required fix if fail: make a correction reply say it was applied, without changing the status codes or the contract's existing success shape. The contract change must be written in docs/ingestion/contract-replay-delta.md first.
- Re-check after fix: pending

## Provider outage
- Expected outcome: nothing is invented, unsaved events are absent, and the sender is told "not saved."
- What the implementation does: a failed write returns a 500 error response, never the replay success.
- Evidence: the agent's report said "returns a 500 error response and never reports success." I did not force a database failure, so this is from the agent's report and not a live test.
- Result: pass, on the agent's report only
- Required fix if fail: none
- Re-check after fix: not needed

## Final verdict
- All five cases, the key check, and the replay-return check are pass: no. The late-correction reply fails, and the partial batch is not applicable.
- Safe for coaches to trust stored stats from this storage path: no, not until the open fixes below are closed
- Open fixes still required:
  - the late-correction reply wording
  - batch handling when a batch endpoint exists
  - a 500 response is used but is not in the contract or the error model
  - the service-role key is also used by app/server/directory.ts, which conflicts with docs/access/service-role-key-rule.md
  - the endpoint does not yet check who is sending
  - the outage case was not live-tested