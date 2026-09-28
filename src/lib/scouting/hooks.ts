import { useQuery } from '@tanstack/react-query'
import {
  getGameById,
  getPlayerById,
  listEvents,
  listEventsWithPlayer,
  listGames,
  listPlayers,
  type EventListFilters,
  type GameListFilters,
  type PlayerListFilters,
} from './queries'
import { getPlayerEventCountsForGame } from './rpc'
import { scoutingKeys } from './query-keys'

export function usePlayers(filters: PlayerListFilters = {}) {
  return useQuery({
    queryKey: scoutingKeys.players.list(filters),
    queryFn: () => listPlayers(filters),
  })
}

export function usePlayer(id: string) {
  return useQuery({
    queryKey: scoutingKeys.players.detail(id),
    queryFn: () => getPlayerById(id),
    enabled: Boolean(id),
  })
}

export function useGames(filters: GameListFilters = {}) {
  return useQuery({
    queryKey: scoutingKeys.games.list(filters),
    queryFn: () => listGames(filters),
  })
}

export function useGame(id: string) {
  return useQuery({
    queryKey: scoutingKeys.games.detail(id),
    queryFn: () => getGameById(id),
    enabled: Boolean(id),
  })
}

export function useEvents(filters: EventListFilters = {}) {
  return useQuery({
    queryKey: scoutingKeys.events.list(filters),
    queryFn: () => listEvents(filters),
  })
}

export function useEventsWithPlayer(filters: EventListFilters = {}) {
  return useQuery({
    queryKey: scoutingKeys.events.withPlayer(filters),
    queryFn: () => listEventsWithPlayer(filters),
  })
}

export function usePlayerEventCountsForGame(gameId: string) {
  return useQuery({
    queryKey: scoutingKeys.aggregates.playerEventCountsForGame(gameId),
    queryFn: () => getPlayerEventCountsForGame(gameId),
    enabled: Boolean(gameId),
  })
}
