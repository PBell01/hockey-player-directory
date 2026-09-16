import { describe, expect, it } from 'vitest'
import { mapDirectoryRow, type DirectoryRow } from './mappers'

// Reliable row mapping keeps the directory's player and staff information trustworthy for operations teams.
describe('mapDirectoryRow', () => {
  it('maps an active player row to the expected directory entry fields', () => {
    const row: DirectoryRow = {
      id: 'player-42',
      full_name: 'Alex Mercer',
      role: 'player',
      position_or_title: 'F',
      jersey_number: 42,
      team_name: 'Toronto',
      is_active: true,
    }

    expect(mapDirectoryRow(row)).toEqual({
      id: 'player-42',
      name: 'Alex Mercer',
      role: 'player',
      position: 'F',
      number: 42,
      team: 'Toronto',
      status: 'active',
    })
  })

  it('maps a staff row with an unrecognized position or title to a null position', () => {
    const row: DirectoryRow = {
      id: 'staff-12',
      full_name: 'Morgan Lee',
      role: 'staff',
      position_or_title: 'Head Equipment Manager',
      jersey_number: null,
      team_name: 'Toronto',
      is_active: true,
    }

    expect(mapDirectoryRow(row)).toEqual({
      id: 'staff-12',
      name: 'Morgan Lee',
      role: 'staff',
      position: null,
      number: null,
      team: 'Toronto',
      status: 'active',
    })
  })

  it('converts a numeric-string jersey number to a number', () => {
    const row: DirectoryRow = {
      id: 'player-7',
      full_name: 'Brody Stone',
      role: 'player',
      position_or_title: 'D',
      jersey_number: '7',
      team_name: 'Toronto',
      is_active: true,
    }

    expect(mapDirectoryRow(row).number).toBe(7)
  })

  it('maps an invalid jersey number to null', () => {
    const row: DirectoryRow = {
      id: 'player-31',
      full_name: 'Carter Quinn',
      role: 'player',
      position_or_title: 'G',
      jersey_number: 'unknown',
      team_name: 'Toronto',
      is_active: true,
    }

    expect(mapDirectoryRow(row).number).toBeNull()
  })

  it('maps a null team name to an empty team string', () => {
    const row: DirectoryRow = {
      id: 'staff-24',
      full_name: 'Taylor Brooks',
      role: 'staff',
      position_or_title: 'Video Coach',
      jersey_number: null,
      team_name: null,
      is_active: true,
    }

    expect(mapDirectoryRow(row).team).toBe('')
  })

  it("maps an inactive row to an 'inactive' status", () => {
    const row: DirectoryRow = {
      id: 'player-17',
      full_name: 'Dylan Price',
      role: 'player',
      position_or_title: 'F',
      jersey_number: 17,
      team_name: 'Buffalo',
      is_active: false,
    }

    expect(mapDirectoryRow(row).status).toBe('inactive')
  })
})
