# Hockey Event Ingestion — Client Story Brief

## Restated client story
The hockey operations team needs two separate things from the team app.

First, an outside hockey data company wants to send game events straight into our app, such as a goal or a penalty, so staff do not have to type them in by hand. The company sends the events on its own schedule, and the app needs to accept them.

Second, a coach wants to fill in a player evaluation form after practice and hand it in. The app needs to take that evaluation and keep it with the right player.

These are different jobs with different people, so they are handled as two workflows.

## Workflows

### Workflow A — Provider pushes game events
- Trigger (what starts this): Something happens in a game and the data provider decides to send it to us.
- What the provider sends: One or more game events, such as a goal or a penalty, for a particular game.
- What our app should do with it: Accept the events from a provider we trust and make them available to the team.
- What "done" looks like for the provider: The provider knows the events were received, or is told clearly that they were not.

### Workflow B — Coach submits a player evaluation
- Trigger (what starts this): A practice ends and the coach wants to record how a player did.
- What the coach fills in: An evaluation of a player, covering what the coach observed at practice.
- What our app should do with it: Take the evaluation and keep it with that player so staff can find it later.
- What "done" looks like for the coach: The coach knows the evaluation was saved, or is told clearly what is wrong.

## Actors
| Actor | Role in this story | What they want |
| --- | --- | --- |
| Third-party hockey data provider | Outside company that sends game events to the team | To deliver events once and know they arrived |
| Coach | Team staff member who evaluates players after practice | To record an evaluation quickly and trust it was saved |

## Goals
- Provider goal: Send game events to the team app reliably and get a clear answer back.
- Coach goal: Submit a player evaluation after practice without it getting lost.
- Team / app goal: Have game events and coach evaluations arrive accurately, from the right sources, without manual re-entry.

## Success criteria
- Provider: this worked when the events they sent show up in the team app and they were told they were received.
- Coach: this worked when the evaluation is saved against the right player and the coach sees that it was saved.
- Team: this worked when staff can see both the game events and the coach evaluations and trust where they came from.

## Questions we must not skip
- How do we know the provider is who they say they are?
- Can a pushed event be corrected later? If yes, who is allowed to correct it, and when?
- Is a draft evaluation allowed, or must every coach submission be complete?
- What should happen if the provider sends the same event twice?
- Who is allowed to see a coach's evaluation after it is submitted?

## Explicitly out of scope for this brief
This page captures what people need, not how the software is built. It does not list web addresses, button layouts, or database tables. Those decisions come in later steps and must answer this brief, not replace it.