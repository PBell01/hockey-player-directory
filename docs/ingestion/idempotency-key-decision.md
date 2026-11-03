# What makes two deliveries the same hockey event

## The question
When the provider sends something again, which facts must match before we treat the two deliveries as one hockey event?

## Chosen identity (the idempotency key)
The key is the provider's own stable id for that happening on the ice. The provider assigns it when the event happens, and it stays the same every time the provider sends that event again. It does not come from our app, and it is not the time we received the message.

This is an event-identity key, not a request-fingerprint key. Sending the same id again means "this is the same event," even if one detail in the message is different. We do not reject a resend just because its body differs from the first one. A difference in the details is how a correction shows up.

If the provider turns out to have no single id for an event, the fallback is the game plus the provider's own sequence number for that event. That number is assigned when the event happens, not when we receive it. The existing contract already requires a provider event id, so the id is the choice for now.

## My hockey check
Sam's goal in game 14 is sent, the provider times out and sends it again with the same provider event id, so the second delivery matches the first and Sam's goal is counted once.

## Why an exact replay stays one event
The same goal sent again with the same details carries the same provider event id, so it matches the identity we already stored. It is recognized as the same event and does not become a second stat.

## Why a correction can still be recognized
If the assist is fixed from unknown to Riley, the provider event id does not change, so the corrected message still matches the original event. The full set of event details is not the key, because a fixed detail would then look like a brand-new goal and the wrong assist would never be replaced.

## Rejected: arrival time alone
A retry arrives later than the first try, so the time we received it is different. The second delivery would look new, and one goal would be stored as two stats that coaches would not trust.

## Rejected: a brand-new id on each delivery
If a fresh id is created on every try, the retry gets a different name from the first delivery. It would look like a different event, and one goal would become two stats.

## Another option I rejected
Using only the event type, such as the word "goal," as the key. Two real goals in the same game would share it, so the second real goal would be treated as a repeat and lost. That mashes two different events into one.

## What this note does not decide
This note does not say what reply a replay should get, and it does not describe how stats are stored. Later steps do that. No code belongs in this file.