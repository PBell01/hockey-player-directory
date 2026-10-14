import { getRequestHeader } from '@tanstack/react-start/server'
import { createServerFn } from '@tanstack/react-start'
import { requireSession } from '../lib/auth/require-session'
import { createSupabaseServerClient } from '../lib/supabase/server'
import type { Tables } from '../types/database'

export type ScoutingNoteRow = Tables<'scouting_events'>

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
    setAll: () => undefined,
  }
}

export const listScoutingNotes = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ScoutingNoteRow[]> => {
    await requireSession()

    const supabase = createSupabaseServerClient(getRequestCookies())
    const { data, error } = await supabase
      .from('scouting_events')
      .select(
        'id, game_id, player_id, event_type, notes, period, clock_time, created_at',
      )

    if (error) {
      throw new Error(`Unable to load scouting events: ${error.message}`)
    }

    return data ?? []
  },
)
