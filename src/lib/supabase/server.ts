// Server-only. Do not import this file from browser/React component code.
import { createServerClient, type CookieMethodsServer } from '@supabase/ssr'
import type { Database } from '../../types/database'

function requireServerEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing ${name} for the server Supabase client`)
  }
  return value
}

export function createSupabaseServerClient(cookies: CookieMethodsServer) {
  const url = requireServerEnv('VITE_SUPABASE_URL', process.env.VITE_SUPABASE_URL)
  const anonKey = requireServerEnv('VITE_SUPABASE_ANON_KEY', process.env.VITE_SUPABASE_ANON_KEY)

  return createServerClient<Database>(url, anonKey, { cookies })
}