import { getRequestHeader, setResponseHeader, getResponseHeader } from '@tanstack/react-start/server'
import { createSupabaseServerClient } from '../supabase/server'

export type SessionUser = {
  id: string
  email: string | undefined
}

function getServerCookies() {
  return {
    getAll: () => {
      const cookieHeader = getRequestHeader('cookie') ?? ''
      return cookieHeader
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          const i = part.indexOf('=')
          return {
            name: i >= 0 ? part.slice(0, i) : part,
            value: i >= 0 ? decodeURIComponent(part.slice(i + 1)) : '',
          }
        })
    },
    setAll: (cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) => {
      for (const { name, value } of cookiesToSet) {
        const existing = getResponseHeader('set-cookie')
        const existingArr = Array.isArray(existing) ? existing : existing ? [existing] : []
        setResponseHeader('set-cookie', [
          ...existingArr,
          `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax`,
        ])
      }
    },
  }
}

export async function requireSession(): Promise<SessionUser> {
  const supabase = createSupabaseServerClient(getServerCookies())
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw new Error(`Unable to read authentication session: ${error.message}`)
  }

  if (!data.session?.user) {
    throw new Error('Unauthorized: sign in required')
  }

  return {
    id: data.session.user.id,
    email: data.session.user.email,
  }
}