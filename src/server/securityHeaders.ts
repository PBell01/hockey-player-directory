// Defines the security response headers for the roster tool.
// This module only DEFINES them. It does not attach them to responses.
// Values are constants written here, never copied from the incoming request.
// See docs/security/security-headers-notes.md for why each one exists.

export type SecurityHeader = {
  name: string
  value: string
}

// One CSP directive per line so a reviewer can explain each rule.
export const contentSecurityPolicyDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  // Scripts: this site only. No *, no 'unsafe-inline', no 'unsafe-eval'.
  "script-src 'self' 'unsafe-inline'",
  // Styles may be inline because the Tailwind/React app needs it.
  // Do NOT copy 'unsafe-inline' onto script-src.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob:",
  "font-src 'self' data: https://fonts.gstatic.com",
  // The browser talks to Supabase over https and a secure websocket.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "upgrade-insecure-requests",
] as const

export const contentSecurityPolicy = contentSecurityPolicyDirectives.join('; ')

export const securityHeaders: readonly SecurityHeader[] = [
  { name: 'Content-Security-Policy', value: contentSecurityPolicy },
  { name: 'X-Content-Type-Options', value: 'nosniff' },
  { name: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { name: 'X-Frame-Options', value: 'DENY' },
  { name: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // 180 days. No preload and no includeSubDomains.
  { name: 'Strict-Transport-Security', value: 'max-age=15552000' },
  { name: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
]

export function securityHeadersAsRecord(): Record<string, string> {
  return Object.fromEntries(securityHeaders.map((h) => [h.name, h.value]))
}