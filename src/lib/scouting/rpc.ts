import { supabase } from '../supabase/client'

export type PlayerEventCountRow = {
  player_id: string
  player_name: string
  event_count: number
  goal_count: number
}

export async function getPlayerEventCountsForGame(
  gameId: string,
): Promise<PlayerEventCountRow[]> {
  const { data, error } = await supabase.rpc(
    // @ts-expect-error Regenerate database.ts after applying the RPC migration.
    'player_event_counts_for_game',
    { p_game_id: gameId },
  )

  if (error) {
    throw new Error(error.message)
  }

  return data
}
