import { Link, createFileRoute } from '@tanstack/react-router'
import { parsePlayerIdParam } from '../../lib/playerParams'

export const Route = createFileRoute('/players/$playerId')({
  params: {
    parse: (raw) => ({
      playerId: parsePlayerIdParam(raw.playerId),
    }),
    stringify: (parsed) => ({
      playerId: parsePlayerIdParam(parsed.playerId),
    }),
  },
  component: PlayerDetailPage,
})

function PlayerDetailPage() {
  const { playerId } = Route.useParams()

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link
        to="/players"
        className="text-sm font-medium text-slate-600 underline underline-offset-4"
      >
        Back to players
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        Player {playerId}
      </h1>

      <p className="mt-2 text-slate-600">
        Player detail placeholder for hockey operations staff.
      </p>
    </main>
  )
}
