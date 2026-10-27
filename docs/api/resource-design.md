# Resource Design: Hockey Event Ingestion and Coach Evaluations

## Purpose
Turn `docs/scoping/resource-inventory.md` into concrete HTTP operations.
Later steps will check the OpenAPI contract against this file.
This file has no status-code table and invents no resources the inventory does not name.

## Source of truth
- Inventory file: `docs/scoping/resource-inventory.md`
- In-scope actors: third-party hockey data provider, coach
- In-scope resources: game event, evaluation form
- Named in the inventory but not exposed as their own API resources in this sprint: player, game (used only to match ids inside events and evaluations), validation problem (part of a refusal response, not a thing with its own path), reviewer (the inventory marks this as an open question)

## Path and method conventions
- Paths name resources (nouns), never actions (verbs).
- A collection path names the group: `/events` and `/evaluations`.
- An item path names one member with a placeholder id, for example `/events/{eventId}`. No item paths are in scope yet.
- Each operation names exactly one caller.
- Out-of-scope operations are listed, not silently omitted.

## Operations

### Resource: Hockey event

| Operation name | Method | Path | Caller | What it does | In scope? | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Provider delivers a game event | POST | /events | Third-party hockey data provider | Offers one new game event to the team app. The app checks the sender and the fields, then accepts or rejects it. | Yes | Inventory: "Accept a provider game event" and the received / accepted / rejected states. |

### Resource: Evaluation form

| Operation name | Method | Path | Caller | What it does | In scope? | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Coach hands in an evaluation | POST | /evaluations | Coach | Offers one new player evaluation. The app checks the fields and saves it, or returns the list of problems. | Yes | Inventory: "Collect a coach evaluation". Whether a draft can be saved is an open decision. |

## Explicitly out of scope

| Refused operation | Method + path not offered | Who might want it | Why it is out of scope |
| --- | --- | --- | --- |
| List all events | GET /events | Staff, provider | The inventory says staff can see accepted events, but it does not say which caller does that or through which API. The existing data layer already serves staff reads. Open decision. |
| Read one event | GET /events/{eventId} | Provider, staff | The inventory gives no lookup need. The provider only needs a clear answer at delivery time. |
| Correct an event | PUT or PATCH /events/{eventId} | Provider, staff | The inventory lists "can a pushed event be corrected" as an open question, so no rule exists. |
| Delete an event | DELETE /events/{eventId} | Provider, staff | Nothing in the inventory authorizes deleting accepted events. |
| List all evaluations | GET /evaluations | Coach, reviewer, staff | The inventory lists "who may see an evaluation" as an open question. Exposing a list could leak evaluations to the wrong people. |
| Read one evaluation | GET /evaluations/{evaluationId} | Coach, reviewer | Same open question about who may see evaluations. |
| Save or update a draft | PUT or PATCH /evaluations/{evaluationId} | Coach | The inventory lists "is a draft allowed" as an open question. |
| Mark an evaluation reviewed | PATCH /evaluations/{evaluationId} | Reviewer | Whether a reviewer step exists is an open question. Software only records review, a person decides. |
| Delete an evaluation | DELETE /evaluations/{evaluationId} | Coach | Not authorized by the inventory. |
| Share an evaluation with a player | Any method on any path | Coach | A human coaching decision. The inventory says software must not decide it. |
| Manage players or games | Any method on /players or /games | Staff | Not part of the provider or coach workflows. Those resources are only referenced by id. |

## Caller matrix

| Actor | May call (method + path) | Must not call |
| --- | --- | --- |
| Third-party hockey data provider | POST /events | Anything on /evaluations. Any read, change, or delete on /events. |
| Coach | POST /evaluations | Anything on /events. Any read, change, or delete on /evaluations in this sprint. |

## Review log

### Cycle 1 — resource versus action
- Reviewer: (your name)
- Paths that looked like actions (verbs) and how you fixed them: The natural first paths were /ingestEvent and /submitEvaluation. Both are verbs. They were replaced with the nouns /events and /evaluations. The methods (POST) carry the action. Final paths checked out loud: /events, /evaluations. No verbs remain.
- Remaining questions: Whether the paths need a shared prefix (for example for versioning). See Open decisions.

### Cycle 2 — missing reads and unsafe updates
- Reviewer: (your name)
- Read operations (GET) you almost added but the inventory did not authorize: GET /events, GET /events/{eventId}, GET /evaluations, GET /evaluations/{evaluationId}. All moved to out of scope, each with a reason.
- Write operations (PUT / PATCH / DELETE) you almost added but the inventory did not authorize: event correction, evaluation drafts, marking reviewed, and deletes of both. All moved to out of scope. Correction, drafts, and review each map to an open question in the inventory.
- Remaining questions: Which API serves staff reads of accepted events and saved evaluations.

## Open decisions
- How does the team verify the provider is who it says it is? This changes who may call POST /events and is not decided here.
- Can an accepted event be corrected, and by whom? If yes, a change operation must be added and this file revised.
- Is a draft evaluation allowed? If yes, a save-draft operation is needed.
- What should happen if the provider sends the same event twice?
- Does the provider send events one at a time or in batches? This path assumes one at a time.
- Who may read a submitted evaluation, and through which operation?
- Who serves staff reads of accepted events: this API or the existing data layer?
- Does the API need a path prefix or version?