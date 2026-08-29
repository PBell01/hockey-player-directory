import { Link, createFileRoute } from '@tanstack/react-router'
import {
  DEFAULT_GAMES_SEARCH,
  type GamesSearch,
  validateGamesSearch,
} from '../../lib/searchSchemas'
import { listGames } from '../../server/directoryLoader'

export const Route = createFileRoute('/games/')({
  validateSearch: (search) => validateGamesSearch(search),
  loader: ({ location }) => {
    return listGames(validateGamesSearch(location.search))
  },
  component: GamesIndexPage,
})

function GamesIndexPage() {
  const search = Route.useSearch()
  const games = Route.useLoaderData()

  const setTeam = (team: string) =>
    (prev: Partial<GamesSearch> = {}): GamesSearch => ({
      team,
      date: prev.date ?? DEFAULT_GAMES_SEARCH.date,
    })

  const setDate = (date: string) =>
    (prev: Partial<GamesSearch> = {}): GamesSearch => ({
      team: prev.team ?? DEFAULT_GAMES_SEARCH.team,
      date,
    })

  const clearFilters = (): GamesSearch => ({
    ...DEFAULT_GAMES_SEARCH,
  })

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">Games</h1>

      <p className="mt-2 text-slate-600">
        Schedule view shell for upcoming and recent games.
        Filters help narrow the schedule for staff planning.
      </p>

      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Link to="/games" search={setTeam('TOR')}>
            Toronto
          </Link>
          <Link to="/games" search={setTeam('BUF')}>
            Buffalo
          </Link>
          <Link to="/games" search={setTeam('')}>
            All Teams
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/games" search={setDate('2026-01-15')}>
            Jan 15, 2026
          </Link>
          <Link to="/games" search={setDate('2026-02-01')}>
            Feb 1, 2026
          </Link>
          <Link to="/games" search={clearFilters}>
            Clear
          </Link>
        </div>

        <p className="text-sm text-slate-600">
          Current filters: Team {search.team || 'All'} · Date {search.date || 'Any'}
        </p>
      </div>

      {games.length === 0 ? (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5 text-slate-700">
          <h2 className="text-lg font-semibold text-slate-900">No games match these filters</h2>
          <p className="mt-2">Try clearing the current filters or browse the roster to find a player.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/games" search={clearFilters} className="font-medium text-sky-700 underline underline-offset-4">
              Clear filters
            </Link>
            <Link to="/players" search={{ position: 'all', status: 'active' }} className="font-medium text-sky-700 underline underline-offset-4">
              Go to players
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-slate-700">
          {games.map((game) => (
            <li key={game.id}>
              {game.date} · {game.opponent} · {game.venue === 'home' ? 'Home' : 'Away'} · {game.status}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
