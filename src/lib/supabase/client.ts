import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../../types/database'

function requirePublicEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing ${name}`)
  }
  return value
}

export function createSupabaseBrowserClient() {
  const url = requirePublicEnv('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL)
  const anonKey = requirePublicEnv('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY)

  return createBrowserClient<Database>(url, anonKey)
}

export const supabase = createSupabaseBrowserClient()