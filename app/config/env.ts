function requireValue(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export const publicEnv = {
  supabaseUrl: requireValue('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: requireValue(
    'VITE_SUPABASE_ANON_KEY',
    import.meta.env.VITE_SUPABASE_ANON_KEY,
  ),
} as const

// WARNING: serverEnv is server-only. Client components and browser-bundled routes
// must not import this export or any module that imports it.
export const serverEnv = {
  supabaseServiceRoleKey: requireValue(
    'SUPABASE_SERVICE_ROLE_KEY',
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ),
} as const
