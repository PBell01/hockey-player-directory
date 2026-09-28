import { supabase } from '../supabase/client'
import type { Database } from '../../types/database'

export type EventInsert = Database['public']['Tables']['scouting_events']['Insert']
export type EventRow = Database['public']['Tables']['scouting_events']['Row']
export type EventUpdate = Database['public']['Tables']['scouting_events']['Update']
export type GameInsert = Database['public']['Tables']['games']['Insert']
export type GameRow = Database['public']['Tables']['games']['Row']
export type GameUpdate = Database['public']['Tables']['games']['Update']
export type PlayerInsert = Database['public']['Tables']['players']['Insert']
export type PlayerUpdate = Database['public']['Tables']['players']['Update']
export type PlayerRow = Database['public']['Tables']['players']['Row']

export type MutationResult<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string } }

export async function createPlayer(
  input: PlayerInsert,
): Promise<MutationResult<PlayerRow>> {
  if (!input.name || input.name.trim() === '') {
    return { data: null, error: { message: 'A player name is required' } }
  }

  if (!input.position || input.position.trim() === '') {
    return { data: null, error: { message: 'A player position is required' } }
  }

  if (!input.team_org_label || input.team_org_label.trim() === '') {
    return {
      data: null,
      error: { message: 'A player team or organization label is required' },
    }
  }

  const { data, error } = await supabase
    .from('players')
    .insert(input)
    .select()
    .single()

  if (error) {
    return { data: null, error: { message: error.message } }
  }

  return { data, error: null }
}

export async function updatePlayer(
  playerId: string,
  input: PlayerUpdate,
): Promise<MutationResult<PlayerRow>> {
  if (playerId.trim() === '') {
    return { data: null, error: { message: 'A playerId is required' } }
  }

  const { data, error } = await supabase
    .from('players')
    .update(input)
    .eq('id', playerId)
    .select()
    .single()

  if (error) {
    return { data: null, error: { message: error.message } }
  }

  return { data, error: null }
}

export async function createGame(
  input: GameInsert,
): Promise<MutationResult<GameRow>> {
  if (!input.opponent || input.opponent.trim() === '') {
    return { data: null, error: { message: 'A game opponent is required' } }
  }

  if (!input.game_date || input.game_date.trim() === '') {
    return { data: null, error: { message: 'A game date is required' } }
  }

  const { data, error } = await supabase
    .from('games')
    .insert(input)
    .select()
    .single()

  if (error) {
    return { data: null, error: { message: error.message } }
  }

  return { data, error: null }
}

export async function updateGame(
  gameId: string,
  input: GameUpdate,
): Promise<MutationResult<GameRow>> {
  if (gameId.trim() === '') {
    return { data: null, error: { message: 'A gameId is required' } }
  }

  const { data, error } = await supabase
    .from('games')
    .update(input)
    .eq('id', gameId)
    .select()
    .single()

  if (error) {
    return { data: null, error: { message: error.message } }
  }

  return { data, error: null }
}

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

export async function updateScoutingEvent(
  eventId: string,
  input: EventUpdate,
): Promise<MutationResult<EventRow>> {
  if (eventId.trim() === '') {
    return { data: null, error: { message: 'An eventId is required' } }
  }

  const { data, error } = await supabase
    .from('scouting_events')
    .update(input)
    .eq('id', eventId)
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
