// Server-side CSRF / origin gate for writes.
// It answers one question: did this write start from our app?
// It does not sign anyone in, does not read a session, and does not import Supabase.
// Ingestion routes will call it in a later step. Do not wire it here.

export type CsrfReason =
  | 'cross-site'
  | 'origin-mismatch'
  | 'missing-origin'
  | 'allowlist-empty'

export type CsrfResult =
  | { ok: true }
  | { ok: false; status: 403; reason: CsrfReason }

const STATE_CHANGING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export function isStateChangingMethod(method: string): boolean {
  return STATE_CHANGING.has(method.toUpperCase())
}

// Compare origins only (scheme + host + port), never a path.
function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, '').toLowerCase()
}

// Trusted public origins from APP_ORIGIN (comma-separated). Empty means NONE, not all.
export function readAllowedOrigins(): string[] {
  const raw = process.env.APP_ORIGIN ?? ''
  return raw
    .split(',')
    .map(normalizeOrigin)
    .filter((part) => part.length > 0)
}

export function checkCsrf(
  request: Request,
  allowedOrigins: string[] = readAllowedOrigins(),
): CsrfResult {
  // Reads (GET, HEAD, OPTIONS) pass through. Blocking them would break page loads.
  if (!isStateChangingMethod(request.method)) {
    return { ok: true }
  }

  // Fail closed: no allowlist means refuse every write.
  if (allowedOrigins.length === 0) {
    return { ok: false, status: 403, reason: 'allowlist-empty' }
  }

  // Header names are case-insensitive; Headers.get handles that.
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    return { ok: false, status: 403, reason: 'cross-site' }
  }

  const originHeader = request.headers.get('origin')
  if (!originHeader) {
    return { ok: false, status: 403, reason: 'missing-origin' }
  }

  const allowed = new Set(allowedOrigins.map(normalizeOrigin))
  if (!allowed.has(normalizeOrigin(originHeader))) {
    return { ok: false, status: 403, reason: 'origin-mismatch' }
  }

  return { ok: true }
}

// null means the route may continue. A Response means stop with 403.
export function csrfBlockResponse(request: Request): Response | null {
  const result = checkCsrf(request)
  if (result.ok) return null
  return new Response(JSON.stringify({ error: 'forbidden', reason: result.reason }), {
    status: 403,
    headers: { 'content-type': 'application/json' },
  })
}