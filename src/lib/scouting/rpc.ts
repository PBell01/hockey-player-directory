import { supabase } from '../supabase/client'
import type { Database } from '../../types/database'

export type PlayerEventCountRow =
  Database['public']['Functions']['player_event_counts_for_game']['Returns'][number]

export async function getPlayerEventCountsForGame(
  gameId: string,
): Promise<PlayerEventCountRow[]> {
  const { data, error } = await supabase.rpc(
    'player_event_counts_for_game',
    { p_game_id: gameId },
  )

  if (error) {
    throw new Error(error.message)
  }

  return data
}
