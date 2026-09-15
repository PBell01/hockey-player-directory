export type DirectoryRow = {
  id: string
  full_name: string
  role: 'player' | 'staff'
  position_or_title: string
  jersey_number: number | string | null
  team_name: string | null
  is_active: boolean
}

export type DirectoryEntry = {
  id: string
  name: string
  role: 'player' | 'staff'
  position: 'F' | 'D' | 'G' | null
  number: number | null
  team: string
  status: 'active' | 'ir' | 'inactive'
}

export function mapDirectoryRow(row: DirectoryRow): DirectoryEntry {
  const position = ['F', 'D', 'G'].includes(row.position_or_title)
    ? (row.position_or_title as DirectoryEntry['position'])
    : null
  const jerseyNumber = row.jersey_number === null ? null : Number(row.jersey_number)

  return {
    id: row.id,
    name: row.full_name,
    role: row.role,
    position,
    number: Number.isFinite(jerseyNumber) ? jerseyNumber : null,
    team: row.team_name ?? '',
    status: row.is_active ? 'active' : 'inactive',
  }
}
