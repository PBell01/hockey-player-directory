import { supabase } from '../supabase/client'
import type { Database } from '../../types/database'

export type EventInsert = Database['public']['Tables']['scouting_events']['Insert']
export type EventRow = Database['public']['Tables']['scouting_events']['Row']
export type PlayerUpdate = Database['public']['Tables']['players']['Update']
export type PlayerRow = Database['public']['Tables']['players']['Row']

export type MutationResult<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string } }

export async function createScoutingEvent(
  input: EventInsert,
): Promise<MutationResult<EventRow>> {
  if (!input.player_id) {
    return {
      data: null,
      error: { message: 'A player_id is required to create a scouting event' },
    }
  }

  if (!input.game_id) {
    return {
      data: null,
      error: { message: 'A game_id is required to create a scouting event' },
    }
  }

  if (!input.event_type || input.event_type.trim() === '') {
    return {
      data: null,
      error: { message: 'An event_type is required to create a scouting event' },
    }
  }

  const { data, error } = await supabase
    .from('scouting_events')
    .insert(input)
    .select()
    .single()

  if (error) {
    return { data: null, error: { message: error.message } }
  }

  return { data, error: null }
}

export async function updatePlayerNotes(
  playerId: string,
  notes: string,
): Promise<MutationResult<PlayerRow>> {
  if (playerId.trim() === '') {
    return {
      data: null,
      error: { message: 'A playerId is required to update player notes' },
    }
  }

  const update: PlayerUpdate = { notes }
  const { data, error } = await supabase
    .from('players')
    .update(update)
    .eq('id', playerId)
    .select()
    .single()

  if (error) {
    return { data: null, error: { message: error.message } }
  }

  return { data, error: null }
}
