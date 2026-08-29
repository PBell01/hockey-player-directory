import { hockeyGames, hockeyPlayers, type SeedGame, type SeedPlayer } from '../data/hockeySeed'
import type { GamesSearch, PlayersSearch } from '../lib/searchSchemas'

export type DirectoryFilters = {
  position?: PlayersSearch['position']
  status?: PlayersSearch['status']
  team?: string
  date?: string
}

export function listPlayers(filters: Partial<PlayersSearch> = {}): SeedPlayer[] {
  const position = filters.position ?? 'all'
  const status = filters.status ?? 'active'

  return hockeyPlayers.filter((player) => {
    const matchesPosition = position === 'all' || player.position === position
    const matchesStatus = status === 'all' || player.status === status

    return matchesPosition && matchesStatus
  })
}

export function getPlayerById(playerId: string): SeedPlayer | undefined {
  return hockeyPlayers.find((player) => player.id === playerId)
}

export function listGames(filters: Partial<GamesSearch> = {}): SeedGame[] {
  const team = (filters.team ?? '').trim().toUpperCase()
  const date = (filters.date ?? '').trim()

  return hockeyGames.filter((game) => {
    const matchesTeam =
      !team || game.opponent.toUpperCase().includes(team) || game.venue.toUpperCase() === team
    const matchesDate = !date || game.date === date

    return matchesTeam && matchesDate
  })
}
