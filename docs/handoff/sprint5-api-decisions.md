# Sprint 5 API decisions: stakeholder handoff

Audience: coaches and the product owner (non-engineers).
Sources used (this memo does not contradict them):
- docs/scoping/client-story-brief.md
- docs/api/resource-design.md
- openapi/hockey-ingestion.yaml
- docs/api/acceptance-criteria.md

## 1. What we set out to do

The client story had two separate jobs. First, an outside hockey data company needs to send game events, such as a goal or a penalty, straight into our app so staff don't type them in by hand. Second, a coach needs to hand in a player evaluation after practice and trust that it was received. The client-story brief keeps these as two separate workflows, and so does everything built since.

## 2. What we delivered this sprint

- **Resource design:** a written list of exactly what can be sent to the app. There are two things, game events and coach evaluations. Each has one address and one action: "send a new one." Nothing else is allowed yet.
- **Shared contract:** one agreement that spells out what a game event and an evaluation must contain, what the app says when it accepts them, and what it says when something is wrong. The data company's engineers can build against this without asking us questions.
- **Server-side checking:** the app's server, not the form on a coach's screen, decides whether a submission is acceptable. If a required piece is missing or the wrong kind of value, the server sends back a list that names each problem field and says what to fix.
- **Acceptance criteria and tests:** plain "given, when, then" stories for both jobs, plus automated checks that run them. A good submission is accepted. A bad one is refused, and the refusal names the field.

## 3. Decisions a stakeholder must know

### What can be sent, and what happens

| What | Address in the contract | Action | If it works | If it doesn't |
| --- | --- | --- | --- | --- |
| Game event (from the data company) | /events | Send a new one | "Created" answer with the event | Refusal naming the field |
| Coach evaluation | /evaluations | Send a new one | "Created" answer with the evaluation | Refusal naming the field |

In the running app these two addresses currently sit under `/api`, so they appear as `/api/events` and `/api/evaluations`. No other addresses exist. There is no way yet to look up, change, or delete anything that was sent.

### Error format

When something is wrong, the server always answers in the same format, for events and evaluations alike. It gives a short summary and a list. Each item in the list names the field, gives a short code, and explains what to fix. For example, a missing period on an event comes back as "period is required."

The contract uses these status numbers:
- **201:** accepted and created.
- **400:** the request couldn't be read at all, such as an empty message or one that isn't JSON.
- **422:** the message was readable but a field is missing or wrong.
- **401, 403, 409:** documented in the contract for later (not signed in, not allowed, duplicate event). The app does not return these yet, because they depend on identity and storage.

### What we deliberately deferred

- **Identity:** we do not yet check who is sending. Anyone who knows the address can send something.
- **Persistence:** accepted game events are now saved, once per provider event id. Accepted evaluations are still not saved.
- **Screens:** we did not build the coach evaluation form.
- **Open items:** the open questions in section 6. They are questions, not hidden features.

## 4. Who owns what

### Frontend
The coach-facing form (not built yet) and any instructions for the data company. The form may check things in the browser to help the coach, and it should show the field-by-field messages the server sends back. A browser check is a convenience and never the final say.

### Backend
Only the server accepts or refuses a submission. It reads the message, checks every field, and answers with either "created" or the structured list of problems. It does this for both jobs, in the same way.

### Database
Game events are saved in a separate table, once per provider event id. Evaluations are not saved yet. Batch delivery and sender identity are not built.

### Manual process
Coaching judgment stays human. A coach decides what to write, whether an evaluation is ready to share with a player, and what it means for the player's development. The app only receives and records what a person decides.

## 5. What the next Sprint 5 topic should implement first

1. **Identity** for the data company and for coaches, so we know who is allowed to send.
2. **Persistence**, saving an accepted submission after it passes the checks.

Identity comes first because we should not store writes we can't attribute to someone.

## 6. Open questions for the next topic

- How does the data company prove it is the data company?
- Can a sent event be corrected later, and if so, by whom?
- Is a draft evaluation allowed, or must every submission be complete?
- What should happen if the data company sends the same event twice?
- Does the data company send events one at a time or in batches?
- Who may read an evaluation after it is submitted?