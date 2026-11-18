// Front desk for one player read: parse the id, decide CSRF, call the service,
// map the answer. No database access and no roster rules live here.

import { createServerFn } from '@tanstack/react-start'

type PlayerRosterView = {
  playerId: string
  name: string
  number: number | null
  position: string | null
  team: string | null
  notes?: string | null
}

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
  const { readPlayerRoster: readOnServer } = await import('./getPlayerRoster.server')
  return readOnServer(rawPlayerId, options)
}

export const getPlayerRoster = createServerFn({ method: 'GET' })
  .validator((input: { playerId: unknown }) => input)
  .handler(async ({ data }): Promise<PlayerRosterResponse> => {
    const { readPlayerRoster: readOnServer } = await import('./getPlayerRoster.server')
    return readOnServer(data.playerId)
  })