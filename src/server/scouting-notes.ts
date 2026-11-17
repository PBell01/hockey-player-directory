import { createServerFn } from '@tanstack/react-start'
import { getAuthedServerClient, requireSession } from '../lib/auth/require-session'
import {
  authorizeKind,
  authorizeResource,
  ResourceNotFoundError,
} from './authorizeResource'
import type { Tables } from '../types/database'



export type ScoutingNoteRow = Tables<'scouting_events'>

export const getScoutingNote = createServerFn({ method: 'GET' })
  .validator((noteId: string) => noteId)
  .handler(async ({ data: noteId }): Promise<ScoutingNoteRow | null> => {
    try {
      await authorizeResource({ kind: 'scouting_note', id: noteId })
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw new Response('Forbidden', { status: 403 })
      }
      throw error
    }

    const supabase = getAuthedServerClient()
    const { data, error } = await supabase
      .from('scouting_events')
      .select('id, game_id, player_id, event_type, notes, period, clock_time, created_at')
      .eq('id', noteId)
      .maybeSingle()

    if (error) {
      throw new Error(`Unable to load scouting event: ${error.message}`)
    }
    return data
  })

export const listScoutingNotes = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ScoutingNoteRow[]> => {
    await requireSession()

    // Gate first, before any database read of scouting_events.
    try {
      await authorizeKind('scouting_note')
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw new Response('Forbidden', { status: 403 })
      }
      throw error
    }

    const supabase = getAuthedServerClient()
    const { data, error } = await supabase
      .from('scouting_events')
      .select('id, game_id, player_id, event_type, notes, period, clock_time, created_at')

    if (error) {
      throw new Error(`Unable to load scouting events: ${error.message}`)
    }
    return data ?? []
  },
)