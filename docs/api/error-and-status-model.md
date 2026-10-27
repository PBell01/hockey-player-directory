# Error and Status Model

## Purpose
One shared agreement for how the hockey ingestion API reports success and failure.
Every operation in `docs/api/resource-design.md` appears below. The hockey data provider and coaches should never receive a bare "something went wrong."

## Required status-code vocabulary
Only these codes are used. No exceptions are recorded.

| Code | Name | Meaning in this API |
| --- | --- | --- |
| 200 | OK | A fetch succeeded; the body is the requested resource. No in-scope operation uses it yet. |
| 201 | Created | A new event or evaluation was accepted and created. |
| 400 | Bad Request | The HTTP request is unusable (not JSON, empty body, wrong Content-Type). |
| 401 | Unauthorized | No valid identity was provided. |
| 403 | Forbidden | Identity is valid, but this caller may not perform this action. |
| 404 | Not Found | The requested resource id does not exist. No in-scope operation uses it yet. |
| 409 | Conflict | The request is well-formed but collides with stored data (duplicate provider event id). |
| 422 | Unprocessable Entity | JSON parsed, but one or more fields failed schema or business rules. |

## Status-code map
This lists every operation from `docs/api/resource-design.md`, with the same method and path. No paths were added. An em dash means that failure cannot apply.

| Operation name | Method | Path | Success | Malformed request | Validation | Missing identity | Not allowed | Resource missing | Conflict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider delivers a game event | POST | /events | 201 | 400 | 422 | 401 | 403 | — | 409 |
| Coach hands in an evaluation | POST | /evaluations | 201 | 400 | 422 | 401 | 403 | — | — |

Success bodies:
- `POST /events` returns the created event record, including its stored state.
- `POST /evaluations` returns the created evaluation record.

Notes:
- There are no fetch operations in scope, so no row uses 200 or 404. The reads were moved to out of scope in the resource design. If one is added later, it gets 200 on success and 404 for an unknown id.
- `POST /evaluations` has no 409 because the inventory defines no uniqueness rule for evaluations. See Open questions.
- 401 and 403 are reserved now even though sign-in for the provider and coaches is not built in this sprint.

## Hockey stories for each failure code

- **400**: the provider posts a body that is empty or is not JSON.
- **401**: the provider posts an event with no credentials at all.
- **403**: a known identity that is not the provider (for example a coach) posts to `/events`, or the provider posts to `/evaluations`.
- **404**: not used by any in-scope operation. For a later read, it would mean asking for an id that was never stored.
- **409**: the provider resends an event whose provider event id is already stored. The body is valid, but accepting it would create a duplicate.
- **422**: an event arrives with period 9, or a coach leaves a required rating blank.

## Structured error envelope
Every non-success response uses this exact shape. Events and evaluations share it.

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Short human summary of the whole failure.",
    "details": [
      {
        "field": "period",
        "code": "OUT_OF_RANGE",
        "message": "period must be 1, 2, 3, or OT."
      }
    ]
  }
}
```

Rules:
- `error.code` is a stable machine-readable token in SCREAMING_SNAKE_CASE.
- `error.message` is a summary only. It is never the only information on a 422.
- `error.details` is always an array. It is empty for 400, 401, 403, and 404 when no field applies. It has one or more entries for every 422, and for a 409 when a specific field caused the collision.
- Each detail has `field` (a dot path into the request body, or `""` when not field-specific), `code` (machine-readable), and `message` (what the coach or integrator should change).

## Standard `error.code` values

| error.code | Typical status | When to use |
| --- | --- | --- |
| MALFORMED_REQUEST | 400 | Body missing, not JSON, or otherwise unusable. |
| UNAUTHENTICATED | 401 | No valid identity. |
| FORBIDDEN | 403 | Identity known, action not allowed. |
| NOT_FOUND | 404 | Resource id does not exist. Reserved for later reads. |
| CONFLICT | 409 | Duplicate provider event id or other unique collision. |
| VALIDATION_FAILED | 422 | One or more fields failed schema or business rules. |

Standard `details[].code` values used in the examples: `REQUIRED`, `OUT_OF_RANGE`, `DUPLICATE`.

## Worked failure examples
The envelope shape is identical in every example.

### Provider sends an event with a missing period
Status: 422

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The event could not be accepted because one field is invalid.",
    "details": [
      { "field": "period", "code": "REQUIRED", "message": "period is required." }
    ]
  }
}
```

### Provider resends an event id the API already stored
Status: 409

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "An event with this provider event id is already stored.",
    "details": [
      { "field": "providerEventId", "code": "DUPLICATE", "message": "providerEventId has already been received." }
    ]
  }
}
```

### Coach submits an evaluation with a blank required rating
Status: 422

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The evaluation could not be saved because one field is invalid.",
    "details": [
      { "field": "ratings.skating", "code": "REQUIRED", "message": "ratings.skating is required." }
    ]
  }
}
```

### Caller asks for an evaluation id that does not exist (for a future read)
Status: 404. This is illustrative only. No in-scope operation can produce it today.

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "No evaluation exists with that id.",
    "details": []
  }
}
```

## Decision: 400 vs 422
400 is only for requests that cannot be used at all: the body is empty, is not JSON, or has the wrong Content-Type. The server cannot begin checking fields. 422 is for requests whose JSON parsed but whose fields fail rules, such as a missing period or a blank rating. Every bad field is listed in `error.details`. This API will never return 200 with `{ "success": false }` for a failed create or submit. A failure always uses a 4xx status and the envelope above.

## Out of scope
- 5xx crash shapes (log them; do not invent a second client error format)
- How tokens are issued or stored
- Database tables or UI screens
- OpenAPI YAML and route code

## Open questions
- Does `providerEventId` exist as a field? The resource design lists "same event twice" as open. The 409 example assumes the provider sends its own event id.
- Should `POST /evaluations` return 409 for a repeated submission (the same coach, player, and practice date)? The inventory is silent.
- Will batch event delivery be allowed? A batch needs a rule for partial failure, which changes the status codes.
- If a read is added later, which status does a caller get when they may not see an evaluation: 403 or 404?