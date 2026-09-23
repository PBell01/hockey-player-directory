import type { QueryData } from '@supabase/supabase-js'
import { supabase } from '../supabase/client'
import type { Database } from '../../types/database'

export type PlayerRow = Database['public']['Tables']['players']['Row']
export type GameRow = Database['public']['Tables']['games']['Row']
export type EventRow = Database['public']['Tables']['scouting_events']['Row']

export type PlayerListFilters = {
  position?: PlayerRow['position']
  teamOrgLabel?: PlayerRow['team_org_label']
}

export type GameListFilters = {
  dateFrom?: GameRow['game_date']
  dateTo?: GameRow['game_date']
}

export type EventListFilters = {
  playerId?: EventRow['player_id']
  gameId?: EventRow['game_id']
  eventType?: EventRow['event_type']
}

export async function listPlayers(
  filters: PlayerListFilters = {},
): Promise<PlayerRow[]> {
  let query = supabase.from('players').select('*')

  if (filters.position !== undefined) {
    query = query.eq('position', filters.position)
  }

  if (filters.teamOrgLabel !== undefined) {
    query = query.eq('team_org_label', filters.teamOrgLabel)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}

export async function getPlayerById(id: PlayerRow['id']): Promise<PlayerRow | null> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function listGames(
  filters: GameListFilters = {},
): Promise<GameRow[]> {
  let query = supabase.from('games').select('*')

  if (filters.dateFrom !== undefined) {
    query = query.gte('game_date', filters.dateFrom)
  }

  if (filters.dateTo !== undefined) {
    query = query.lte('game_date', filters.dateTo)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}

export async function getGameById(id: GameRow['id']): Promise<GameRow | null> {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function listEvents(
  filters: EventListFilters = {},
): Promise<EventRow[]> {
  let query = supabase.from('scouting_events').select('*')

  if (filters.playerId !== undefined) {
    query = query.eq('player_id', filters.playerId)
  }

  if (filters.gameId !== undefined) {
    query = query.eq('game_id', filters.gameId)
  }

  if (filters.eventType !== undefined) {
    query = query.eq('event_type', filters.eventType)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}

const eventsWithPlayerQuery = supabase
  .from('scouting_events')
  .select(
    '*, players ( id, name, position, team_org_label )',
  )

type EventWithPlayerRow = QueryData<typeof eventsWithPlayerQuery>[number]

export async function listEventsWithPlayer(
  filters: EventListFilters = {},
): Promise<EventWithPlayerRow[]> {
  let query = eventsWithPlayerQuery

  if (filters.playerId !== undefined) {
    query = query.eq('player_id', filters.playerId)
  }

  if (filters.gameId !== undefined) {
    query = query.eq('game_id', filters.gameId)
  }

  if (filters.eventType !== undefined) {
    query = query.eq('event_type', filters.eventType)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}
