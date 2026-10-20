import { createServerFn } from '@tanstack/react-start'
import { requireSession, getAuthedServerClient } from '../lib/auth/require-session'
import type { Tables } from '../types/database'

export type ScoutingNoteRow = Tables<'scouting_events'>

export const listScoutingNotes = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ScoutingNoteRow[]> => {
    await requireSession()

    const supabase = getAuthedServerClient()
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