// Front desk for one player read: parse the id, decide CSRF, call the service,
// map the answer. No database access and no roster rules live here.

import { createServerFn } from '@tanstack/react-start'
import { readPlayerRosterForStaff, type PlayerRosterView } from '../services/playerRosterService'
import { getStaffActor } from './authorizeResource'
import { csrfBlockResponse } from './csrf'

export type PlayerRosterResponse =
  | { ok: true; player: PlayerRosterView }
  | { ok: false; error: string }

// Letters, numbers, and hyphens only. Strict UUID checking happens again later.
const PLAYER_ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/

export function parsePlayerId(
  raw: unknown,
): { ok: true; playerId: string } | { ok: false; error: string } {
  if (typeof raw !== 'string') return { ok: false, error: 'Player id is not valid.' }
  const playerId = raw.trim()
  if (!PLAYER_ID_PATTERN.test(playerId)) {
    return { ok: false, error: 'Player id is not valid.' }
  }
  return { ok: true, playerId }
}

// A roster read does not change saved data, so it skips the CSRF check.
// A call that DID change data would pass changesData: true and a Request,
// and the real helper would run before the service. No Request means refuse.
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
    // Who is asking comes from the server session, never from the caller.
    const actor = await getStaffActor()
    const result = await readPlayerRosterForStaff(actor, parsed.playerId)

    switch (result.outcome) {
      case 'allowed':
        return { ok: true, player: result.view }
      case 'missing_id':
        return { ok: false, error: 'Player id is not valid.' }
      default:
        // not_allowed and not_found look the same, so another player's id
        // is never confirmed to exist.
        return { ok: false, error: 'Player not found.' }
    }
  } catch {
    // Never return error.message or a stack trace to the browser.
    return { ok: false, error: 'Could not load this player.' }
  }
}

export const getPlayerRoster = createServerFn({ method: 'GET' })
  .validator((input: { playerId: unknown }) => input)
  .handler(async ({ data }): Promise<PlayerRosterResponse> => {
    return readPlayerRoster(data.playerId)
  })