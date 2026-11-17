// Business rule: what may this staff member learn about one player?
// Plain inputs, plain answers. No Request, no cookies, no HTTP status numbers.
// The actor is ordinary data, built by the trusted boundary from the session.

import { findPlayerById } from '../data/playerAccess'
import {
  authorizeResource,
  decideResourceAccess,
  ResourceNotFoundError,
  type StaffActor,
} from '../server/authorizeResource'

export type { StaffActor }

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
  actor: StaffActor,
  playerId: string,
): Promise<RosterReadResult> {
  // 1. A blank id is not a player. Stop before any lookup.
  if (typeof playerId !== 'string' || playerId.trim() === '') {
    return { outcome: 'missing_id' }
  }

  // 2. May this actor open this kind of record? Denied and malformed ids both
  //    end here, so the app never confirms another player's id is real.
  try {
    await authorizeResource({ kind: 'player', id: playerId, actor })
  } catch (error) {
    if (error instanceof ResourceNotFoundError) return { outcome: 'not_allowed' }
    throw error
  }

  // 3. Load the stored facts through the data-access layer.
  const record = await findPlayerById(playerId)
  if (!record) return { outcome: 'not_found' }

  // 4. May this role learn confidential scouting facts?
  const mayLearnConfidential =
    decideResourceAccess(actor.role, 'scouting_note') === 'allow'

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