export type PlayerPosition = 'F' | 'D' | 'G' | 'all'
export type PlayerStatus = 'active' | 'ir' | 'all'

export type PlayersSearch = {
  position: PlayerPosition
  status: PlayerStatus
}

export type GamesSearch = {
  team: string
  date: string
}

export const DEFAULT_PLAYERS_SEARCH: PlayersSearch = {
  position: 'all',
  status: 'active',
}

export const DEFAULT_GAMES_SEARCH: GamesSearch = {
  team: '',
  date: '',
}

function normalizePlayerPosition(value: unknown): PlayerPosition {
  const candidate = typeof value === 'string' ? value.trim().toLowerCase() : ''

  switch (candidate) {
    case 'f':
      return 'F'
    case 'd':
      return 'D'
    case 'g':
      return 'G'
    case 'all':
      return 'all'
    default:
      return DEFAULT_PLAYERS_SEARCH.position
  }
}

function normalizePlayerStatus(value: unknown): PlayerStatus {
  const candidate = typeof value === 'string' ? value.trim().toLowerCase() : ''

  switch (candidate) {
    case 'active':
      return 'active'
    case 'ir':
      return 'ir'
    case 'all':
      return 'all'
    default:
      return DEFAULT_PLAYERS_SEARCH.status
  }
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(`${value}T00:00:00Z`)

  if (Number.isNaN(parsed.getTime())) {
    return false
  }

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  )
}

export function validatePlayersSearch(raw: unknown): PlayersSearch {
  if (raw === null || typeof raw !== 'object') {
    return { ...DEFAULT_PLAYERS_SEARCH }
  }

  const candidate = raw as Record<string, unknown>

  return {
    position: normalizePlayerPosition(candidate.position),
    status: normalizePlayerStatus(candidate.status),
  }
}

export function validateGamesSearch(raw: unknown): GamesSearch {
  if (raw === null || typeof raw !== 'object') {
    return { ...DEFAULT_GAMES_SEARCH }
  }

  const candidate = raw as Record<string, unknown>
  const team = typeof candidate.team === 'string' ? candidate.team.trim().toUpperCase() : ''
  const date = typeof candidate.date === 'string' ? candidate.date.trim() : ''

  return {
    team,
    date: isValidIsoDate(date) ? date : '',
  }
}
