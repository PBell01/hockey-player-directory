import { getRequestHeader } from '@tanstack/react-start/server'
import { createSupabaseServerClient } from '../supabase/server'

export type SessionUser = {
  id: string
  email: string | undefined
}

function getRequestCookies() {
  const cookieHeader = getRequestHeader('cookie') ?? ''
  const cookies = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf('=')

      return {
        name: separatorIndex >= 0 ? part.slice(0, separatorIndex) : part,
        value: separatorIndex >= 0 ? part.slice(separatorIndex + 1) : '',
      }
    })

  return {
    getAll: () => cookies,
    // Cookie writes require the later @supabase/ssr response-cookie integration.
    setAll: () => undefined,
  }
}

export async function requireSession(): Promise<SessionUser> {
  const supabase = createSupabaseServerClient(getRequestCookies())
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
