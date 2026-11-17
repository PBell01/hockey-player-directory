// Business rule: what may this signed-in staff member learn about one player?
// Plain inputs, plain answers. No Request, no cookies, no HTTP status numbers.
// A later file turns these answers into a web reply.

import { findPlayerById } from '../data/playerAccess'
import {
  authorizeResource,
  decideResourceAccess,
  ResourceNotFoundError,
} from '../server/authorizeResource'

// Safe fields are always present. Confidential fields appear only when allowed.
export type PlayerRosterView = {
  playerId: string
  name: string
  notes?: string | null
}

// These words are not HTTP status numbers.
export type RosterReadResult =
  | { outcome: 'missing_id' }
  | { outcome: 'not_allowed' }
  | { outcome: 'not_found' }
  | { outcome: 'allowed'; view: PlayerRosterView }

export async function readPlayerRosterForStaff(
  playerId: string,
): Promise<RosterReadResult> {
  // 1. A blank id is not a player. Stop before any lookup.
  if (typeof playerId !== 'string' || playerId.trim() === '') {
    return { outcome: 'missing_id' }
  }

  // 2. May this staff member open this player at all? Who is asking comes
  //    from the server session inside authorizeResource, not from the caller.
  let role: string
  try {
    const access = await authorizeResource({ kind: 'player', id: playerId })
    role = access.role
  } catch (error) {
    // Denied, missing, and malformed ids all end here. The caller must treat
    // them the same, so the app never confirms another player's id is real.
    if (error instanceof ResourceNotFoundError) return { outcome: 'not_allowed' }
    throw error
  }

  // 3. Load the stored facts through the data-access layer.
  const record = await findPlayerById(playerId)
  if (!record) return { outcome: 'not_found' }

  // 4. May this role learn confidential scouting facts? Same matrix as scouting notes.
  const mayLearnConfidential = decideResourceAccess(role, 'scouting_note') === 'allow'

  // 5. Build the view by naming fields. Never spread or return the raw row.
  const view: PlayerRosterView = {
    playerId: record.id,
    name: record.name,
  }
  if (mayLearnConfidential) {
    view.notes = record.notes
  }

  return { outcome: 'allowed', view }
}