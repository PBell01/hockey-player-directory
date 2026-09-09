// Server-only Supabase client. Do not import this from browser routes, React
// components, or any other client-bundled code.

import { createClient } from '@supabase/supabase-js'

import { publicEnv, serverEnv } from '../config/env'

export function getSupabaseServerClient() {
  return createClient(publicEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
