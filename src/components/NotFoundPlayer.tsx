import { Link } from '@tanstack/react-router'

export function NotFoundPlayer({ playerId }: { playerId: string }) {
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
        We could not find a player with ID {playerId}. Try another player from the roster.
      </p>
    </main>
  )
}
