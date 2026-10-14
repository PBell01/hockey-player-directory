import { createFileRoute } from '@tanstack/react-router'
import { listScoutingNotes } from '../../server/scouting-notes'

export const Route = createFileRoute('/scouting/')({
  loader: async () => {
    try {
      return {
        scoutingNotes: await listScoutingNotes(),
        signedOut: false,
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Unauthorized:')) {
        return {
          scoutingNotes: [],
          signedOut: true,
        }
      }

      throw error
    }
  },
  component: ScoutingIndexPage,
})

function ScoutingIndexPage() {
  const { scoutingNotes, signedOut } = Route.useLoaderData()

  if (signedOut) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-slate-600">Please sign in to view scouting events.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">Scouting events</h1>

      {scoutingNotes.length === 0 ? (
        <p className="mt-6 text-slate-600">
          No scouting events visible for your account.
        </p>
      ) : (
        <ul className="mt-6 list-disc space-y-2 pl-5 text-slate-700">
          {scoutingNotes.map((scoutingNote) => (
            <li key={scoutingNote.id}>
              {scoutingNote.event_type} · player {scoutingNote.player_id} · game{' '}
              {scoutingNote.game_id}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
