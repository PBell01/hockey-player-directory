import { createServerFn } from '@tanstack/react-start'
import { getAuthedServerClient } from '../lib/auth/require-session'
import {
  authorizeResource,
  ResourceNotFoundError,
} from './authorizeResource'
import type { Database, Tables } from '../types/database'



export type ScoutingNoteRow = Tables<'scouting_events'>
type ScoutingNoteInsert = Database['public']['Tables']['scouting_events']['Insert']
type ScoutingNoteUpdate = Database['public']['Tables']['scouting_events']['Update']

function forbiddenIfUnauthorized(error: unknown): never {
  if (error instanceof ResourceNotFoundError) {
    throw new Response('Forbidden', { status: 403 })
  }
  throw error
}

export const getScoutingNote = createServerFn({ method: 'GET' })
  .validator((noteId: string) => noteId)
  .handler(async ({ data: noteId }): Promise<ScoutingNoteRow | null> => {
    try {
      await authorizeResource({ kind: 'scouting_note', id: noteId })
    } catch (error) {
      forbiddenIfUnauthorized(error)
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

export const createScoutingNote = createServerFn({ method: 'POST' })
  .validator((input: ScoutingNoteInsert) => input)
  .handler(async ({ data: input }): Promise<ScoutingNoteRow> => {
    const noteId = input.id ?? crypto.randomUUID()

    try {
      await authorizeResource({
        action: 'create',
        kind: 'scouting_note',
        id: noteId,
      })
    } catch (error) {
      forbiddenIfUnauthorized(error)
    }

    const supabase = getAuthedServerClient()
    const { data, error } = await supabase
      .from('scouting_events')
      .insert({ ...input, id: noteId })
      .select('id, game_id, player_id, event_type, notes, period, clock_time, created_at')
      .single()

    if (error || !data) {
      throw new Error(`Unable to create scouting event: ${error?.message ?? 'unknown error'}`)
    }
    return data
  })

export const updateScoutingNote = createServerFn({ method: 'POST' })
  .validator((input: { noteId: string; changes: ScoutingNoteUpdate }) => input)
  .handler(async ({ data }): Promise<ScoutingNoteRow> => {
    try {
      await authorizeResource({
        action: 'update',
        kind: 'scouting_note',
        id: data.noteId,
      })
    } catch (error) {
      forbiddenIfUnauthorized(error)
    }

    const supabase = getAuthedServerClient()
    const { data: note, error } = await supabase
      .from('scouting_events')
      .update(data.changes)
      .eq('id', data.noteId)
      .select('id, game_id, player_id, event_type, notes, period, clock_time, created_at')
      .single()

    if (error || !note) {
      throw new Error(`Unable to update scouting event: ${error?.message ?? 'unknown error'}`)
    }
    return note
  })

export const deleteScoutingNote = createServerFn({ method: 'POST' })
  .validator((noteId: string) => noteId)
  .handler(async ({ data: noteId }): Promise<void> => {
    try {
      await authorizeResource({
        action: 'delete',
        kind: 'scouting_note',
        id: noteId,
      })
    } catch (error) {
      forbiddenIfUnauthorized(error)
    }

    const supabase = getAuthedServerClient()
    const { error } = await supabase
      .from('scouting_events')
      .delete()
      .eq('id', noteId)

    if (error) {
      throw new Error(`Unable to delete scouting event: ${error.message}`)
    }
  })

export const listScoutingNotes = createServerFn({ method: 'GET' })
  .validator((noteId?: string) => noteId)
  .handler(async ({ data: noteId }): Promise<ScoutingNoteRow[]> => {
    const authorizedNoteId = noteId ?? ''

    try {
      await authorizeResource({ kind: 'scouting_note', id: authorizedNoteId })
    } catch (error) {
      forbiddenIfUnauthorized(error)
    }

    const supabase = getAuthedServerClient()
    const { data, error } = await supabase
      .from('scouting_events')
      .select('id, game_id, player_id, event_type, notes, period, clock_time, created_at')
      .eq('id', authorizedNoteId)
      .maybeSingle()

    if (error) {
      throw new Error(`Unable to load scouting event: ${error.message}`)
    }
    return data ? [data] : []
  })