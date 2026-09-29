import { useState, type FormEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { usePlayerEventCountsForGame } from '../../lib/scouting/hooks'

export const Route = createFileRoute('/scouting/aggregates')({
  component: ScoutingAggregatesPage,
})

function ScoutingAggregatesPage() {
  const [gameId, setGameId] = useState('')
  const [selectedGameId, setSelectedGameId] = useState('')
  const aggregatesQuery = usePlayerEventCountsForGame(selectedGameId)

  const submitGame = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSelectedGameId(gameId.trim())
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">Scouting aggregates</h1>
      <p className="mt-2 text-slate-600">
        See event and goal counts for each player in one game.
      </p>

      <form className="mt-6 flex flex-wrap gap-2" onSubmit={submitGame}>
        <label className="sr-only" htmlFor="aggregate-game-id">
          Game ID
        </label>
        <input
          id="aggregate-game-id"
          value={gameId}
          onChange={(event) => setGameId(event.target.value)}
          placeholder="Game ID"
          className="min-w-0 flex-1 rounded-md border border-slate-200 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-md bg-sky-700 px-4 py-2 font-medium text-white"
        >
          Load counts
        </button>
      </form>

      {!selectedGameId ? (
        <p className="mt-6 text-slate-600">Enter a game ID to load aggregate counts.</p>
      ) : null}
      {selectedGameId && aggregatesQuery.isPending ? (
        <p className="mt-6">Loading aggregate counts...</p>
      ) : null}
      {selectedGameId && aggregatesQuery.isError ? (
        <p className="mt-6 text-rose-700">Unable to load aggregate counts.</p>
      ) : null}
      {selectedGameId && aggregatesQuery.isSuccess && aggregatesQuery.data.length === 0 ? (
        <p className="mt-6 text-slate-600">No event counts were found for this game.</p>
      ) : null}
      {selectedGameId && aggregatesQuery.isSuccess && aggregatesQuery.data.length > 0 ? (
        <table className="mt-6 min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-semibold">Player</th>
              <th className="px-3 py-2 font-semibold">Events</th>
              <th className="px-3 py-2 font-semibold">Goals</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {aggregatesQuery.data.map((row) => (
              <tr key={row.player_id}>
                <td className="px-3 py-2">{row.player_name}</td>
                <td className="px-3 py-2">{row.event_count}</td>
                <td className="px-3 py-2">{row.goal_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </main>
  )
}
