# Replay comparison

This note records what I predicted before the run and what the app actually did. I did not write a test. I sent the deliveries from PowerShell and read the stored rows in the Supabase SQL Editor. I filled this table.

## Replay set

- Set name (from docs/ingestion/replay-prediction.md): Riley, Jo and Sam goals, with Riley's goal sent twice (D1 to D4, keys pk-101, pk-103, pk-102)
- Source prediction: docs/ingestion/replay-prediction.md
- Rule used to judge the run: docs/ingestion/event-outcome-decision-table.md
- Promised response (from docs/ingestion/contract-replay-delta.md): a replay of the same key returns the original 201 success with the same id and body, is not an error, and saves nothing again.
- Order sent: the same order named in the prediction (D1, D2, D3, D4). I did not reorder it.

## Expected versus actual (second run, after the fix)

| Delivery | What was sent | Expected stored stat | Actual stored stat | Expected response | Actual response | Matches decision table? |
| --- | --- | --- | --- | --- | --- | --- |
| D1 | Goal by Riley, pk-101, 14:20 | One goal for Riley is stored. | One pk-101 row, created 03:47:13.215768 | 201, a new id, state "accepted", and the event. | id 28f9b35f-5d0f-4ffd-b5a2-f82dcc018e21, state "accepted", with the event | yes |
| D2 | Same goal, pk-101 again | Stats do not change. Riley still has one goal. | Still one pk-101 row, and updated_at equals created_at (03:47:13.215768), so nothing was written | The same 201, the same id as D1, and the same body. It is not an error. | Same id 28f9b35f-5d0f-4ffd-b5a2-f82dcc018e21 and same body, plus the optional "replayed": true | yes |
| D3 | Goal by Jo, pk-103, 18:05 | A second goal, Jo's, is stored. Riley's is untouched. | One pk-103 row, created 03:47:13.828882 | 201, a new id, state "accepted". | id e17c4a3f-fda2-4000-b5ec-1a9b3968a70c, state "accepted" | yes |
| D4 | Goal by Sam, pk-102, 09:40, arriving last | Sam's goal is saved even though it arrived late. Nothing already stored is deleted. | One pk-102 row, created 03:47:14.149454, and pk-101 and pk-103 are still there | 201, a new id, state "accepted". | id c3ea82e5-910f-4034-9e43-cf18b4166c30, state "accepted" | yes |

## Decision-table check

- Duplicate case: the decision table says that when the same event arrives again with the same facts, stored stats do not change, the goal is not counted a second time, and the sender hears it is already saved.
- Duplicate case, final actual stored stat: one pk-101 row, unchanged, as the query returned after the second run.
- Out-of-order case: the decision table says a new event that arrives late is saved and included in the stats, is not rejected for being late, and nothing already stored is deleted.
- Out-of-order case, final actual stored stat: pk-102 (the 09:40 goal) was stored as its own row even though it arrived last, and the other two rows stayed.

## Mismatches and fixes

- First-run mismatches: in the first run, D2 (the exact repeat of pk-101) came back with "corrected": true, and the stored row's updated_at had changed. The decision table says an exact duplicate is not a correction, so this was a mismatch against the table. The first-run table was not captured before I cleaned up the test rows, so the evidence for the first run is the replies.
- What I asked the agent to change: I asked it to set "corrected" only when the stored facts differ from the incoming facts, and to skip the update for an exact repeat. The agent said it now compares the stored and incoming facts field by field, and identical facts return the original replay response without corrected and skip the update.
- Later-run actual results: the table above, where D2 returns "replayed": true with no corrected and no write.
- Prediction slip: my prediction's snapshot said "Riley's late goal", but the late goal is Sam's (D4). I left the sealed file unchanged. The expected columns here are copied as written.

## Proof

A retried goal is still counted once: yes.
The row that shows it: delivery 2.
In plain language: Riley's goal was sent twice, and the app stored one row with the same id and did not write to it the second time.