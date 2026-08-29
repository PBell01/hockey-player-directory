import { Link, createFileRoute } from '@tanstack/react-router'
import { parsePlayerIdParam } from '../../lib/playerParams'
import { getPlayerById } from '../../server/directoryLoader'

export const Route = createFileRoute('/players/$playerId')({
  params: {
    parse: (raw) => ({
      playerId: parsePlayerIdParam(raw.playerId),
    }),
    stringify: (parsed) => ({
      playerId: parsePlayerIdParam(parsed.playerId),
    }),
  },
  loader: ({ params }) => {
    return getPlayerById(params.playerId)
  },
  component: PlayerDetailPage,
})

function PlayerDetailPage() {
  const player = Route.useLoaderData()
  const { playerId } = Route.useParams()

  if (!player) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <Link
          to="/players"
          search={{ position: 'all', status: 'active' }}
          className="text-sm font-medium text-slate-600 underline underline-offset-4"
        >
          Back to players
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          Player not found
        </h1>

        <p className="mt-2 text-slate-600">
          We could not find a player with ID {playerId}. Try another folder entry from the roster.
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link
        to="/players"
        search={{ position: 'all', status: 'active' }}
        className="text-sm font-medium text-slate-600 underline underline-offset-4"
      >
        Back to players
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-slate-900">{player.name}</h1>

      <dl className="mt-4 space-y-2 text-slate-700">
        <div>
          <dt className="font-semibold">Player ID</dt>
          <dd>{player.id}</dd>
        </div>
        <div>
          <dt className="font-semibold">Number</dt>
          <dd>#{player.number}</dd>
        </div>
        <div>
          <dt className="font-semibold">Position</dt>
          <dd>{player.position}</dd>
        </div>
        <div>
          <dt className="font-semibold">Team</dt>
          <dd>{player.team}</dd>
        </div>
      </dl>
    </main>
  )
}
