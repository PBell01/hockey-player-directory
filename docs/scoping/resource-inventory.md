# Resource inventory — hockey event ingestion and coach evaluations

Source brief: `docs/scoping/client-story-brief.md`
Scope rule: this document does not design URLs, HTTP methods, or status codes.
If the brief does not answer something, it is listed under Open questions. No rule is invented.

## 1. Actors

| Actor | What they want | Which flow they touch | Notes |
| --- | --- | --- | --- |
| Third-party hockey data provider | To deliver game events once and know they arrived or were refused | events | Outside company, not team staff |
| Coach | To record a player evaluation after practice and trust it was saved | evaluations | Fills in the form |
| Reviewer (for example a head coach) | To look over a submitted evaluation | evaluations | Only if the brief implies a human reviews forms. See Open questions. |

## 2. Resource candidates

| Resource | Plain-language definition | Who creates it | Who reads it |
| --- | --- | --- | --- |
| Game event | One thing that happened in a game, such as a goal or a penalty | Data provider | Team staff |
| Evaluation form | A coach's written assessment of one player after practice | Coach | Coach, reviewer (who else is an open question) |
| Player | A person on the roster that an event or evaluation is about | Team staff | Provider (for matching), coach, staff |
| Game | A single game that events belong to | Team staff | Provider (for matching), staff |
| Validation problem | A list of what is wrong with a refused event or form | The system | Provider or coach |

## 3. Inputs and outputs

### Event ingestion
- Inputs (fields that arrive from the provider):
  - Which game the event belongs to
  - Event type (for example goal or penalty)
  - Period and clock time
  - Which player the event involves
- Outputs (what we store or send back):
  - An accepted event record
  - Or a list of field problems explaining the refusal

### Evaluation forms
- Inputs (fields a coach provides):
  - Which player is being evaluated
  - Practice date
  - Skill ratings
  - Written comments
- Outputs:
  - A saved evaluation
  - Or a list of field problems

## 4. Workflow states

### Game events

| State | Who or what puts it here | What happens next |
| --- | --- | --- |
| received | The provider's delivery arrives | The system checks the sender and the fields |
| accepted | The system, after the checks pass | The event is kept and staff can see it |
| rejected | The system, after a check fails | The provider is told what was wrong. The event is not kept as accepted. |

### Evaluation forms

| State | Who or what puts it here | What happens next |
| --- | --- | --- |
| draft | The coach, while still writing | The coach finishes it later (only if drafts are allowed. See Open questions.) |
| submitted | The coach, when they send it | It is saved and waits for any review |
| reviewed | A person (the reviewer), after reading it | Recorded as reviewed. Sharing decisions stay with people. |

The state names match the brief. None were added or renamed.

## 5. Approval and review points

| Decision | Who decides | May software decide this? | Why |
| --- | --- | --- | --- |
| Is this evaluation ready to share with a player? | Coach or head coach | no | Human coaching judgment |
| Has this evaluation been reviewed? | Reviewer | no | A person must read it. Software only records that they did. |
| Is the player's development plan changed because of an evaluation? | Coaching staff | no | Human coaching judgment |
| Is a pushed event well formed and from a trusted sender? | The system | yes | A rule check, not a judgment about a player |
| Should a wrong event be corrected? | Unknown | unknown | The brief does not say. See Open questions. |

## 6. System boundaries

| Concern | Frontend (screens) | Backend API (doorway) | Database (storage) | Manual coaching process |
| --- | --- | --- | --- | --- |
| Collect a coach evaluation | Screen where the coach fills in and sends the form | Receives the form and checks it | Keeps the saved evaluation | Coach decides what to write |
| Accept a provider game event | Not involved. The provider is not a screen user. | Receives the event from the provider, checks who sent it and the fields | Keeps the accepted event | None |
| Reject incomplete or invalid data | Shows the coach what is wrong | Refuses the data and returns the list of problems to the provider or coach | Does not keep rejected data as accepted | None |
| Keep an accepted record | Shows records to staff | Hands accepted records over for storage | Holds the long-term record | None |
| Decide a player's development plan | Can display the plan once a person records it | Records the decision, does not make it | Stores the recorded decision | Coaching staff make the decision |

## 7. What we will not automate

- Deciding whether an evaluation is ready to share with a player
- Deciding whether an evaluation counts as reviewed (software only records it)
- Deciding a player's development plan based on an evaluation

## 8. Open questions

- How do we know the provider is who they say they are?
- Can a pushed event be corrected later? If yes, who may correct it, and when?
- Is a draft evaluation allowed, or must every coach submission be complete?
- What should happen if the provider sends the same event twice?
- Who may see a coach's evaluation after it is submitted?
- Is there a reviewer step at all, and who is the reviewer?
- Does the provider need to be told about each event individually or once per batch?
- What should happen to a rejected event: is it discarded or kept for staff to look at?