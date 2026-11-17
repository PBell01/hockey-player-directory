// Bottom layer only. No HTTP. No React. No "who may see this" decision.
// Uses the signed-in user's server client, so row-level security still applies.
// The player id is passed as a bound value, never glued into a SQL string.

import { getAuthedServerClient } from '../lib/auth/require-session'
import type { Tables } from '../types/database'

export type PlayerRow = Tables<'players'>

// Returns the row, or null when no row matches (or the database hides it).
// Throws if the database reports an error.
export async function findPlayerById(playerId: string): Promise<PlayerRow | null> {
  const supabase = getAuthedServerClient()
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', playerId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}