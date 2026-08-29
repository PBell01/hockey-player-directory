import { createFileRoute } from '@tanstack/react-router'
import { listGames, listPlayers } from '../server/directoryLoader'

export const Route = createFileRoute('/')({
  loader: async () => {
    const players = listPlayers({ status: 'active' })
    const games = listGames()

    return {
      players,
      games,
    }
  },
  component: HomePage,
})

function HomePage() {
  const data = Route.useLoaderData()

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Hockey Ops Player Directory
      </h1>

      <p className="mt-2 text-slate-600">
        Staff landing page for roster and schedule entry points. Open Players
        for the directory list or Games for upcoming matchups.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-md bg-slate-100 p-4">
          <p className="text-sm font-medium text-slate-500">Active players</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{data.players.length}</p>
        </div>

        <div className="rounded-md bg-slate-100 p-4">
          <p className="text-sm font-medium text-slate-500">Upcoming games</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{data.games.length}</p>
        </div>
      </div>

      <div className="mt-6 rounded-md bg-slate-100 p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Quick roster snapshot</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {data.players.slice(0, 3).map((player) => (
            <li key={player.id}>
              #{player.number} {player.name} · {player.position}
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
