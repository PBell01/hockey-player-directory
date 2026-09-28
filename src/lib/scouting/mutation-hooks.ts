import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import {
  createGame,
  createPlayer,
  createScoutingEvent,
  updateGame,
  updatePlayer,
  updatePlayerNotes,
  updateScoutingEvent,
  type EventInsert,
  type EventUpdate,
  type GameInsert,
  type GameUpdate,
  type PlayerInsert,
  type PlayerUpdate,
} from './mutations'
import { scoutingKeys } from './query-keys'

async function invalidateEventQueries(
  queryClient: QueryClient,
  playerId: string,
  gameId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: scoutingKeys.events.all(),
    }),
    queryClient.invalidateQueries({
      queryKey: scoutingKeys.events.list({ playerId }),
    }),
    queryClient.invalidateQueries({
      queryKey: scoutingKeys.events.list({ gameId }),
    }),
    queryClient.invalidateQueries({
      queryKey: scoutingKeys.events.withPlayer({ playerId }),
    }),
    queryClient.invalidateQueries({
      queryKey: scoutingKeys.events.withPlayer({ gameId }),
    }),
    queryClient.invalidateQueries({
      queryKey: scoutingKeys.players.detail(playerId),
    }),
    queryClient.invalidateQueries({
      queryKey: scoutingKeys.games.detail(gameId),
    }),
    queryClient.invalidateQueries({
      queryKey: scoutingKeys.aggregates.playerEventCountsForGame(gameId),
    }),
  ])
}

export function useCreatePlayer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: PlayerInsert) => createPlayer(input),
    onSuccess: async (result) => {
      if (result.error) {
        return
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: scoutingKeys.players.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: scoutingKeys.players.detail(result.data.id),
        }),
      ])
    },
  })
}

type UpdatePlayerVariables = [playerId: string, input: PlayerUpdate]

export function useUpdatePlayer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ([playerId, input]: UpdatePlayerVariables) =>
      updatePlayer(playerId, input),
    onSuccess: async (result, [playerId]) => {
      if (result.error) {
        return
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: scoutingKeys.players.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: scoutingKeys.players.detail(playerId),
        }),
      ])
    },
  })
}

export function useCreateGame() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: GameInsert) => createGame(input),
    onSuccess: async (result) => {
      if (result.error) {
        return
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: scoutingKeys.games.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: scoutingKeys.games.detail(result.data.id),
        }),
      ])
    },
  })
}

type UpdateGameVariables = [gameId: string, input: GameUpdate]

export function useUpdateGame() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ([gameId, input]: UpdateGameVariables) =>
      updateGame(gameId, input),
    onSuccess: async (result, [gameId]) => {
      if (result.error) {
        return
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: scoutingKeys.games.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: scoutingKeys.games.detail(gameId),
        }),
      ])
    },
  })
}

export function useCreateScoutingEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: EventInsert) => createScoutingEvent(input),
    onSuccess: async (result, input) => {
      if (result.error) {
        return
      }

      await invalidateEventQueries(
        queryClient,
        input.player_id,
        input.game_id,
      )
    },
  })
}

type UpdateScoutingEventVariables = [eventId: string, input: EventUpdate]

export function useUpdateScoutingEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ([eventId, input]: UpdateScoutingEventVariables) =>
      updateScoutingEvent(eventId, input),
    onSuccess: async (result) => {
      if (result.error) {
        return
      }

      await invalidateEventQueries(
        queryClient,
        result.data.player_id,
        result.data.game_id,
      )
    },
  })
}

type UpdatePlayerNotesVariables = Parameters<typeof updatePlayerNotes>

export function useUpdatePlayerNotes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ([playerId, notes]: UpdatePlayerNotesVariables) =>
      updatePlayerNotes(playerId, notes),
    onSuccess: async (result, [playerId]) => {
      if (result.error) {
        return
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: scoutingKeys.players.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: scoutingKeys.players.detail(playerId),
        }),
      ])
    },
  })
}
