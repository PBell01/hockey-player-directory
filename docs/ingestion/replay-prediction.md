# Replay prediction (sealed before any replay)

## Seal
- Written at: 11/3/2026 at 5:48 PM
- Written before any replay was run: yes
- I did not send these deliveries, and I did not ask an agent to fill in the outcomes: Yes

## Rules I am applying
- Source docs: event-outcome-decision-table.md, storage-rule.md, idempotency-key-decision.md, contract-replay-delta.md, storage-implementation-review.md
- Idempotency key: the provider's own event id (`providerEventId`). Same id means same event, even if a detail differs.
- Replay response promise: a first save returns 201 with the new id, state "accepted", and the event. A replay of the same id returns that same 201 with the same id and body. It is not an error, and nothing is saved again. An optional "replayed" hint may be added.
- Implementation review: storage matched the decision table for duplicates and out-of-order events in my live tests.
- Gap to watch later: the optional replayed hint was absent in the earlier test. The contract allows that. This file does not change the app.

## Example deliveries

| Label | What happened in the game | Key | Game time | Arrival order | Case |
| --- | --- | --- | --- | --- | --- |
| D1 | Goal by Riley | pk-101 | Period 1, 14:20 | 1 | first save |
| D2 | The same goal by Riley, sent again | pk-101 | Period 1, 14:20 | 2 | duplicate |
| D3 | Goal by Jo | pk-103 | Period 1, 18:05 | 3 | first save |
| D4 | Goal by Sam | pk-102 | Period 1, 09:40 | 4 | out of order |

D4 happened earlier in the game than D1 and D3, but it arrives last.

## Expected results

| Label | Expected stored stat | Expected response | Decision-table case | Storage-rule phrase |
| --- | --- | --- | --- | --- |
| D1 | One goal for Riley is stored. | 201, a new id, state "accepted", and the event. | first save | "one key, one stored event" |
| D2 | Stats do not change. Riley still has one goal. | The same 201, the same id as D1, and the same body. It is not an error. | duplicate | "exact replay: do not insert again" |
| D3 | A second goal, Jo's, is stored. Riley's is untouched. | 201, a new id, state "accepted". | first save | "one key, one stored event" |
| D4 | Sam's goal is saved even though it arrived late. Nothing already stored is deleted. | 201, a new id, state "accepted". | out of order | "a new key is kept, even if it arrives out of order" |

## Snapshot after the whole list
- Goals stored: 3 (Riley's goal once, Jo's, and Sam's).
- Other events stored: Riley's late goal sits with the others. Stats come from what is stored, not from arrival order.
- I did not run this list. There is no actual-result column.