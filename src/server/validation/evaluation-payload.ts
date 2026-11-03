import {
  toFieldErrors,
  isRecord,
  requiredString,
  optionalString,
  type FieldError,
  type Failure,
} from './field-errors'

// Mirrors components.schemas.EvaluationCreate in openapi/hockey-ingestion.yaml.
export type EvaluationPayload = {
  playerId: string
  practiceDate: string
  ratings: Record<string, number>
  comments?: string
}

export type EvaluationValidationResult =
  | { ok: true; data: EvaluationPayload }
  | { ok: false; errors: FieldError[] }

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isRealDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}

export function validateEvaluationPayload(body: unknown): EvaluationValidationResult {
  if (!isRecord(body)) {
    return {
      ok: false,
      errors: toFieldErrors([
        { path: '', code: 'INVALID_TYPE', message: 'Request body must be a JSON object.' },
      ]),
    }
  }

  const failures: Failure[] = []
  const playerId = requiredString(body, 'playerId', failures)
  const practiceDate = requiredString(body, 'practiceDate', failures)
  const comments = optionalString(body, 'comments', failures)

  if (practiceDate !== undefined && !isRealDate(practiceDate)) {
    failures.push({
      path: 'practiceDate',
      code: 'INVALID_FORMAT',
      message: 'practiceDate must be a real date in YYYY-MM-DD format.',
    })
  }

  const ratings: Record<string, number> = {}
  const rawRatings = body.ratings
  if (rawRatings === undefined || rawRatings === null) {
    failures.push({ path: 'ratings', code: 'REQUIRED', message: 'ratings is required.' })
  } else if (!isRecord(rawRatings)) {
    failures.push({
      path: 'ratings',
      code: 'INVALID_TYPE',
      message: 'ratings must be an object of skill ratings.',
    })
  } else {
    for (const [skill, value] of Object.entries(rawRatings)) {
      const path = `ratings.${skill}`
      if (value === undefined || value === null || value === '') {
        failures.push({ path, code: 'REQUIRED', message: `${path} is required.` })
      } else if (typeof value !== 'number' || !Number.isInteger(value)) {
        failures.push({ path, code: 'INVALID_TYPE', message: `${path} must be a whole number.` })
      } else if (value < 1 || value > 5) {
        failures.push({ path, code: 'OUT_OF_RANGE', message: `${path} must be between 1 and 5.` })
      } else {
        ratings[skill] = value
      }
    }
  }

  if (failures.length > 0) {
    return { ok: false, errors: toFieldErrors(failures) }
  }

  return {
    ok: true,
    data: {
      playerId: playerId as string,
      practiceDate: practiceDate as string,
      ratings,
      ...(comments !== undefined ? { comments } : {}),
    },
  }
}