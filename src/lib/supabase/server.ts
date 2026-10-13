// Server-only. Do not import this file from browser/React component code.
//
// This project has TanStack Start server functions, but it does not yet have
// @supabase/ssr or a request-cookie adapter. This foundation accepts a small
// cookie adapter so a later server function can pass request cookies without
// inventing framework APIs here. For production SSR cookie handling, install
// @supabase/ssr with: npm install @supabase/ssr

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database'

type ServerCookie = {
  name: string
  value: string
}

export type ServerCookieAdapter = {
  getAll(): ServerCookie[]
  setAll(cookies: ServerCookie[]): void
}

function requireServerEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing ${name} for the server Supabase client`)
  }

  return value
}

export function createSupabaseServerClient(
  cookies: ServerCookieAdapter,
): SupabaseClient<Database> {
  const url = requireServerEnv(
    'VITE_SUPABASE_URL',
    process.env.VITE_SUPABASE_URL,
  )
  const anonKey = requireServerEnv(
    'VITE_SUPABASE_ANON_KEY',
    process.env.VITE_SUPABASE_ANON_KEY,
  )

  const storage = {
    getItem(key: string): string | null {
      return cookies.getAll().find((cookie) => cookie.name === key)?.value ?? null
    },
    removeItem(key: string): void {
      cookies.setAll([{ name: key, value: '' }])
    },
    setItem(key: string, value: string): void {
      cookies.setAll([{ name: key, value }])
    },
  }

  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage,
    },
  })
}
