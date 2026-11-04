# What the provider can safely retry

Who this is for: the data provider that sends hockey events and our internal operations team.

Key to reuse on every retry: `providerEventId`, the provider's stable id for the event, as chosen in `docs/ingestion/idempotency-key-decision.md`. Do not create a new id for a goal that was already sent.

## Safe (same key and same body only)

- Timeout: If the request timed out, resend the same key and the same body; this is safe and must not add a second goal.
- Exact duplicate: If the same key and the same body are sent again, this is safe and must not add a second goal.
- Outage: If the app or network was down, resend the same key and the same body when service returns; this is safe and must not add a second goal.

What a safe replay returns: Follow the promise in `docs/ingestion/contract-replay-delta.md`: the endpoint returns the original `201` success with the same stored id and event body, does not return an error just because the event was already accepted, and does not save a second copy. An optional `replayed: true` hint may be included.

## Not safe

- New id for the same goal: Do not give the same goal a new `providerEventId`; the app can treat it as a different event, store it separately, and double-count one real goal as two.
- Old body after a correction: Do not resend the old event body after a correction was accepted; it can restore the wrong details, so follow `docs/ingestion/late-correction-handling.md` and send the corrected details with the existing key instead.

## Replay check

`docs/ingestion/replay-comparison.md` shows that the exact duplicate worked after the fix: the second `pk-101` delivery returned `replayed: true`, kept one stored row, and did not update it. It also shows that the different-key out-of-order event was saved without deleting earlier events. Those cases are safe only with the same key and same body; timeout and outage retries follow the documented rule but were not separately replay-tested in that comparison. No open mismatch remains for the safe duplicate or out-of-order behavior.
