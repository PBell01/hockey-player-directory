import {
  toFieldErrors,
  isRecord,
  requiredString,
  optionalString,
  type FieldError,
  type Failure,
} from './field-errors'

// Mirrors components.schemas.HockeyEvent in openapi/hockey-ingestion.yaml.
export type EventPayload = {
  providerEventId: string
  gameId: string
  eventType: string
  period: string
  clockTime: string
  playerId?: string
}

export type EventValidationResult =
  | { ok: true; data: EventPayload }
  | { ok: false; errors: FieldError[] }

export function validateEventPayload(body: unknown): EventValidationResult {
  if (!isRecord(body)) {
    return {
      ok: false,
      errors: toFieldErrors([
        { path: '', code: 'INVALID_TYPE', message: 'Request body must be a JSON object.' },
      ]),
    }
  }

  const failures: Failure[] = []
  const providerEventId = requiredString(body, 'providerEventId', failures)
  const gameId = requiredString(body, 'gameId', failures)
  const eventType = requiredString(body, 'eventType', failures)
  const period = requiredString(body, 'period', failures)
  const clockTime = requiredString(body, 'clockTime', failures)
  const playerId = optionalString(body, 'playerId', failures)

  if (failures.length > 0) {
    return { ok: false, errors: toFieldErrors(failures) }
  }

  return {
    ok: true,
    data: {
      providerEventId: providerEventId as string,
      gameId: gameId as string,
      eventType: eventType as string,
      period: period as string,
      clockTime: clockTime as string,
      ...(playerId !== undefined ? { playerId } : {}),
    },
  }
}