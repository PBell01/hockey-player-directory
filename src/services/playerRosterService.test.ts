import { beforeEach, describe, expect, it, vi } from 'vitest'

// Fakes only. No route, no fetch, no Supabase, no secrets.
const fakes = vi.hoisted(() => {
  class FakeNotFound extends Error {}
  return {
    FakeNotFound,
    authorizeResource: vi.fn(),
    decideResourceAccess: vi.fn(),
    findPlayerById: vi.fn(),
  }
})

vi.mock('../server/authorizeResource', () => ({
  authorizeResource: fakes.authorizeResource,
  decideResourceAccess: fakes.decideResourceAccess,
  ResourceNotFoundError: fakes.FakeNotFound,
}))

vi.mock('../data/playerAccess', () => ({
  findPlayerById: fakes.findPlayerById,
}))

import { readPlayerRosterForStaff } from './playerRosterService'

const playerId = '11111111-2222-4333-8444-555555555555'

// The same confidential facts are loaded in every test, so a denial
// cannot be mistaken for missing data.
const storedPlayer = {
  id: playerId,
  name: 'Alex Chen',
  notes: 'Trade target, day-to-day injury',
}

const scout = { staffId: 'staff-1', role: 'scouting' }
const coach = { staffId: 'staff-2', role: 'coaching' }

beforeEach(() => {
  vi.resetAllMocks()
  fakes.findPlayerById.mockResolvedValue(storedPlayer)
})

describe('roster business rules without HTTP', () => {
  it('returns the name and confidential notes when access is allowed for a scouting role', async () => {
    fakes.authorizeResource.mockResolvedValue({ staffId: 'staff-1', resourceId: playerId, role: 'scouting' })
    fakes.decideResourceAccess.mockReturnValue('allow')

    const result = await readPlayerRosterForStaff(scout, playerId)

    expect(result.outcome).toBe('allowed')
    if (result.outcome === 'allowed') {
      expect(result.view.name).toBe('Alex Chen')
      expect(result.view.notes).toBe('Trade target, day-to-day injury')
    }
  })

  it('withholds the notes from a role that may open the player but not read confidential facts', async () => {
    fakes.authorizeResource.mockResolvedValue({ staffId: 'staff-2', resourceId: playerId, role: 'coaching' })
    fakes.decideResourceAccess.mockReturnValue('deny')

    const result = await readPlayerRosterForStaff(coach, playerId)

    expect(result.outcome).toBe('allowed')
    if (result.outcome === 'allowed') {
      expect(result.view.name).toBe('Alex Chen')
      expect(result.view.notes).toBeUndefined()
    }
    expect(JSON.stringify(result)).not.toContain('Trade target')
  })

  it('returns not_allowed and none of the stored facts when authorization denies that id', async () => {
    fakes.authorizeResource.mockRejectedValue(new fakes.FakeNotFound())

    const result = await readPlayerRosterForStaff(coach, playerId)

    expect(result).toEqual({ outcome: 'not_allowed' })
    expect(JSON.stringify(result)).not.toContain('Alex Chen')
    expect(JSON.stringify(result)).not.toContain('Trade target')
    // The stored row exists, but the service never even loaded it.
    expect(fakes.findPlayerById).not.toHaveBeenCalled()
  })

  it('refuses a blank id before authorization or loading', async () => {
    const result = await readPlayerRosterForStaff(scout, '   ')

    expect(result).toEqual({ outcome: 'missing_id' })
    expect(fakes.authorizeResource).not.toHaveBeenCalled()
    expect(fakes.findPlayerById).not.toHaveBeenCalled()
  })
})