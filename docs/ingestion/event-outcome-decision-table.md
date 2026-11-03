# Event outcome decision table

Checked against: docs/ingestion/duplicate-delivery-impact.md

## Rules this table must not break

1. A second delivery of the same goal must not raise the goal count. One real goal is counted once, no matter how many times it arrives.
2. An event that arrives late must not be dropped forever. A real play that shows up out of order is still a real play and belongs in the stats.

## Outcomes

| Case | What arrived | Stored-stat outcome | What we tell the sender |
| --- | --- | --- | --- |
| Exact duplicate | The same event, with the same facts, arrives again. | Stored stats do not change. The goal is not counted a second time, and no new event is created. | The event is already saved, and nothing changed. This is not a failure, so there is no reason to send it again. |
| Out-of-order arrival | An earlier game moment arrives after a later one, for example minute 8 after minute 12. | If the event is new, it is saved and included in coach stats. It is not rejected for being late, and nothing already stored is deleted. If it turns out to be the same event we already saved, it is treated as an exact duplicate. | The event was saved, if it was new. If it was already saved, the sender gets the exact-duplicate answer. |
| Partial batch | A group of events arrives together, but only some of them are saved. | Each new valid event is saved once, judged on its own. Events that were already saved stay saved even if a neighbor failed. Events that did not save are not in the stats. Resending the whole group does not add a second copy of anything that already saved. | A list of which events saved and which did not, so the sender can resend only the ones that failed. |
| Late correction | The same event arrives again with different facts, for example the goal was player 9, not player 7. | It is still one event. Its stored facts are changed to match the corrected version, and the stats follow the correction. No second goal or second stat line is added, and the new facts are not ignored. | The correction was applied. It was not ignored as a duplicate, and it was not created as a new event. |
| Provider outage | Nothing could be delivered for a stretch, or a save did not succeed. | We do not invent missing goals. Anything that was not saved is absent from the stats. When the provider resends after the outage, each missing event is saved once. | Not saved, whenever the save failed. We never say an event was saved unless it was actually stored. |

## Learner critique

(Reword this in your own voice before you commit.) I kept the late-correction row separate from the duplicate row on purpose. If a repeated minute-10 goal comes back with a different scorer and we treated it as a duplicate, the coach would keep seeing the wrong scorer. If we treated it as a new event, the team would show two goals. So the row says one event, updated facts, and no extra goal. That protects the no-double-goal rule without hiding the fix.

## Left for later steps

- Which fields make two deliveries the same event
- The words and status codes in the existing contract
- How storage is implemented
- What the provider may safely retry, and how often