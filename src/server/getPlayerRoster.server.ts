import { readPlayerRosterForStaff, type PlayerRosterView } from '../services/playerRosterService'
import { getStaffActor } from './authorizeResource'
import { csrfBlockResponse } from './csrf'

type PlayerRosterResponse =
  | { ok: true; player: PlayerRosterView }
  | { ok: false; error: string }

const PLAYER_ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/

function parsePlayerId(
  raw: unknown,
): { ok: true; playerId: string } | { ok: false; error: string } {
  if (typeof raw !== 'string') return { ok: false, error: 'Player id is not valid.' }
  const playerId = raw.trim()
  if (!PLAYER_ID_PATTERN.test(playerId)) {
    return { ok: false, error: 'Player id is not valid.' }
  }
  return { ok: true, playerId }
}

export async function readPlayerRoster(
  rawPlayerId: unknown,
  options: { changesData?: boolean; request?: Request } = {},
): Promise<PlayerRosterResponse> {
  const parsed = parsePlayerId(rawPlayerId)
  if (!parsed.ok) return parsed

  if (options.changesData) {
    if (!options.request) return { ok: false, error: 'Could not load this player.' }
    if (csrfBlockResponse(options.request)) {
      return { ok: false, error: 'Request was refused.' }
    }
  }

  try {
    const actor = await getStaffActor()
    const result = await readPlayerRosterForStaff(actor, parsed.playerId)

    switch (result.outcome) {
      case 'allowed':
        return { ok: true, player: result.view }
      case 'missing_id':
        return { ok: false, error: 'Player id is not valid.' }
      default:
        return { ok: false, error: 'Player not found.' }
    }
  } catch {
    return { ok: false, error: 'Could not load this player.' }
  }
}