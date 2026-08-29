import { Link, createFileRoute } from '@tanstack/react-router'
import { NotFoundPlayer } from '../../components/NotFoundPlayer'
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
    return <NotFoundPlayer playerId={playerId} />
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <Link
          to="/players"
          search={{ position: 'all', status: 'active' }}
          className="font-medium underline underline-offset-4"
        >
          Back to players
        </Link>
        <span>·</span>
        <Link to="/games" search={{ team: '', date: '' }} className="font-medium underline underline-offset-4">
          View games
        </Link>
      </div>

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
