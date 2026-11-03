// Turns validation failures into the error-item shape from
// openapi/hockey-ingestion.yaml (ErrorResponse.error.details[]).

export type FieldError = {
  field: string
  code: string
  message: string
}

export type Failure = {
  path: string
  message: string
  code?: string
}

export function toFieldErrors(failures: Failure[]): FieldError[] {
  return failures.map((f) => ({
    field: f.path,
    code: f.code ?? 'INVALID',
    message: f.message,
  }))
}

// Shared helpers so both payloads report problems the same way.
export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

export function requiredString(
  body: Record<string, unknown>,
  name: string,
  failures: Failure[],
): string | undefined {
  const value = body[name]
  if (value === undefined || value === null) {
    failures.push({ path: name, code: 'REQUIRED', message: `${name} is required.` })
    return undefined
  }
  if (typeof value !== 'string') {
    failures.push({ path: name, code: 'INVALID_TYPE', message: `${name} must be a string.` })
    return undefined
  }
  if (value.trim() === '') {
    failures.push({ path: name, code: 'REQUIRED', message: `${name} must not be blank.` })
    return undefined
  }
  return value
}

export function optionalString(
  body: Record<string, unknown>,
  name: string,
  failures: Failure[],
): string | undefined {
  const value = body[name]
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string') {
    failures.push({ path: name, code: 'INVALID_TYPE', message: `${name} must be a string.` })
    return undefined
  }
  return value
}