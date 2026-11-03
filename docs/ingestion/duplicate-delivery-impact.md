# Why a second delivery corrupts coach stats

## What this note is
This note explains a delivery problem for the hockey app. It describes why the same game event can reach us twice or in the wrong order, and what that does to the numbers coaches trust. It does not change the ingestion endpoint, the HTTP status codes, the server-side validation, or the OpenAPI contract from the first Sprint 5 tutorial.

## The endpoint we already have
The existing ingestion endpoint is the door that already receives hockey events from the data provider, checks them, and answers. We are not rebuilding it or editing it here.

## Why a timeout makes the provider try again
The data provider is an outside company that sends us game facts, such as a goal. A timeout is what happens when the provider sends an event, waits, and gets no answer in time. The answer may have been lost on the network, or our app may have been slow. Either way, the provider cannot tell whether we saved the event. A timeout does not prove the save failed. It only means the provider does not know.

Because the provider does not want to lose a real goal, it sends the event again. That second send is a retry. Retries are normal. They do not mean the provider is careless.

## How the same event can arrive twice
Say the provider sends one goal. The answer never comes back, so the provider sends the same goal again. Our app has now received two messages about one real goal. If the app adds a goal every time a message arrives, one goal becomes two.

## How events can arrive out of order
Messages do not always arrive in the order the game happened. If one message is delayed, a goal at minute 12 can reach us before a goal at minute 8. Both goals are real. They just arrived out of game order.

## What one double-counted goal costs coaches
A double-counted goal makes the score wrong, and it adds an extra goal to a player's total. A coach might praise the wrong scorer or plan a lineup from a number that is not true. Because the app looks official, the mistake gets believed until someone notices. After that, the coach may stop trusting the app, and that loss of trust costs more than the extra digit.

## Five cases this tutorial will rule on later
This note only names each case. It does not decide what to store.

1. Exact duplicate: the same event arrives again, with nothing changed.
2. Out-of-order: a later event arrives before an earlier one.
3. Partial batch: a group of events is sent together, but only some of them arrive.
4. Late correction: a fixed version arrives after the first version was already stored, such as a message saying the goal was player 9, not player 7.
5. Provider outage: the provider stops sending for a while, then comes back and may resend events from the gap.

## What this note does not decide
The correct stored result for each of these five cases is not chosen in this file. Later steps will choose it.