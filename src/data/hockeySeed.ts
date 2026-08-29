export type SeedPlayer = {
  id: string
  name: string
  position: 'F' | 'D' | 'G'
  number: number
  team: string
  status: 'active' | 'ir'
}

export type SeedGame = {
  id: string
  opponent: string
  date: string
  venue: 'home' | 'away'
  status: 'scheduled' | 'final'
}

export const hockeyPlayers: SeedPlayer[] = [
  {
    id: '42',
    name: 'Alex Mercer',
    position: 'F',
    number: 42,
    team: 'Toronto',
    status: 'active',
  },
  {
    id: '7',
    name: 'Brody Stone',
    position: 'D',
    number: 7,
    team: 'Toronto',
    status: 'active',
  },
  {
    id: '31',
    name: 'Carter Quinn',
    position: 'G',
    number: 31,
    team: 'Toronto',
    status: 'active',
  },
  {
    id: '17',
    name: 'Dylan Price',
    position: 'F',
    number: 17,
    team: 'Buffalo',
    status: 'ir',
  },
  {
    id: '24',
    name: 'Evan Brooks',
    position: 'D',
    number: 24,
    team: 'Buffalo',
    status: 'active',
  },
  {
    id: '29',
    name: 'Finn Clarke',
    position: 'G',
    number: 29,
    team: 'Buffalo',
    status: 'active',
  },
]

export const hockeyGames: SeedGame[] = [
  {
    id: 'g-2026-01-15',
    opponent: 'Buffalo Sabres',
    date: '2026-01-15',
    venue: 'home',
    status: 'scheduled',
  },
  {
    id: 'g-2026-02-01',
    opponent: 'Toronto Maple Leafs',
    date: '2026-02-01',
    venue: 'away',
    status: 'scheduled',
  },
  {
    id: 'g-2026-02-12',
    opponent: 'Rochester Americans',
    date: '2026-02-12',
    venue: 'home',
    status: 'final',
  },
]
