import type {
  EventListFilters,
  GameListFilters,
  PlayerListFilters,
} from './queries'

const scoutingRoot = ['scouting'] as const

export const scoutingKeys = {
  all: scoutingRoot,
  players: {
    all: () => [...scoutingRoot, 'players'] as const,
    lists: () => [...scoutingKeys.players.all(), 'list'] as const,
    list: (filters: PlayerListFilters = {}) =>
      [...scoutingKeys.players.lists(), { ...filters }] as const,
    details: () => [...scoutingKeys.players.all(), 'detail'] as const,
    detail: (id: string) =>
      [...scoutingKeys.players.details(), id] as const,
  },
  games: {
    all: () => [...scoutingRoot, 'games'] as const,
    lists: () => [...scoutingKeys.games.all(), 'list'] as const,
    list: (filters: GameListFilters = {}) =>
      [...scoutingKeys.games.lists(), { ...filters }] as const,
    details: () => [...scoutingKeys.games.all(), 'detail'] as const,
    detail: (id: string) => [...scoutingKeys.games.details(), id] as const,
  },
  events: {
    all: () => [...scoutingRoot, 'events'] as const,
    lists: () => [...scoutingKeys.events.all(), 'list'] as const,
    list: (filters: EventListFilters = {}) =>
      [...scoutingKeys.events.lists(), { ...filters }] as const,
    withPlayer: (filters: EventListFilters = {}) =>
      [...scoutingKeys.events.all(), 'with-player', { ...filters }] as const,
  },
  aggregates: {
    all: () => [...scoutingRoot, 'aggregates'] as const,
    playerEventCountsForGame: (gameId: string) =>
      [...scoutingKeys.aggregates.all(), 'player-event-counts', gameId] as const,
  },
} as const
