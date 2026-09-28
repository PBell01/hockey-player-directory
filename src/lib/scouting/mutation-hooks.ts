import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createScoutingEvent,
  updatePlayerNotes,
  type EventInsert,
} from './mutations'
import { scoutingKeys } from './query-keys'

export function useCreateScoutingEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: EventInsert) => createScoutingEvent(input),
    onSuccess: async (result, input) => {
      if (result.error) {
        return
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: scoutingKeys.events.all(),
        }),
        queryClient.invalidateQueries({
          queryKey: scoutingKeys.players.detail(input.player_id),
        }),
        queryClient.invalidateQueries({
          queryKey: scoutingKeys.games.detail(input.game_id),
        }),
        queryClient.invalidateQueries({
          queryKey: scoutingKeys.aggregates.playerEventCountsForGame(
            input.game_id,
          ),
        }),
      ])
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
