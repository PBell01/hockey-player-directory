import { Link, createFileRoute } from '@tanstack/react-router'
import {
  DEFAULT_PLAYERS_SEARCH,
  type PlayersSearch,
  validatePlayersSearch,
} from '../../lib/searchSchemas'
import { listPlayers } from '../../server/directoryLoader'

export const Route = createFileRoute('/players/')({
  validateSearch: (search) => validatePlayersSearch(search),
  loader: ({ location }) => {
    return listPlayers(validatePlayersSearch(location.search))
  },
  component: PlayersIndexPage,
})

function PlayersIndexPage() {
  const search = Route.useSearch()
  const players = Route.useLoaderData()

  const setPosition = (position: PlayersSearch['position']) =>
    (prev: Partial<PlayersSearch> = {}): PlayersSearch => ({
      position,
      status: prev.status ?? DEFAULT_PLAYERS_SEARCH.status,
    })

  const setStatus = (status: PlayersSearch['status']) =>
    (prev: Partial<PlayersSearch> = {}): PlayersSearch => ({
      position: prev.position ?? DEFAULT_PLAYERS_SEARCH.position,
      status,
    })

  const resetFilters = (): PlayersSearch => ({
    ...DEFAULT_PLAYERS_SEARCH,
  })

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">Players</h1>

      <p className="mt-2 text-slate-600">
        Roster directory index for hockey operations staff.
        Each player has a bookmarkable detail page.
      </p>

      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Link to="/players" search={setPosition('F')}>
            Forwards
          </Link>
          <Link to="/players" search={setPosition('D')}>
            Defense
          </Link>
          <Link to="/players" search={setPosition('all')}>
            All Positions
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/players" search={setStatus('active')}>
            Active
          </Link>
          <Link to="/players" search={setStatus('ir')}>
            IR
          </Link>
          <Link to="/players" search={resetFilters}>
            Reset
          </Link>
        </div>

        <p className="text-sm text-slate-600">
          Current filters: Position {search.position} · Status {search.status}
        </p>
      </div>

      <ul className="mt-4 list-disc space-y-1 pl-5 text-slate-700">
        {players.map((player) => (
          <li key={player.id}>
            <Link to="/players/$playerId" params={{ playerId: player.id }}>
              #{player.number} {player.name} — {player.position}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}

