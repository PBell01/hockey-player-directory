import { useState, type FormEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  useGames,
  usePlayerEventCountsForGame,
} from '../../lib/scouting/hooks'

export const Route = createFileRoute('/scouting/aggregates')({
  component: ScoutingAggregatesPage,
})

function ScoutingAggregatesPage() {
  const [gameId, setGameId] = useState('')
  const [selectedGameId, setSelectedGameId] = useState('')

  const gamesQuery = useGames()
  const aggregatesQuery = usePlayerEventCountsForGame(selectedGameId)

  const submitGame = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSelectedGameId(gameId)
  }

  const selectedGame = gamesQuery.data?.find(
    (game) => game.id === selectedGameId,
  )

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Scouting aggregates
      </h1>

      <p className="mt-2 text-slate-600">
        See event and goal counts for each player in one game.
      </p>

      <form
        className="mt-6 flex flex-wrap gap-2"
        onSubmit={submitGame}
      >
        <label className="sr-only" htmlFor="aggregate-game-id">
          Game
        </label>

        <select
          id="aggregate-game-id"
          value={gameId}
          onChange={(event) => setGameId(event.target.value)}
          className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2"
        >
          <option value="">Select a game</option>

          {gamesQuery.data?.map((game) => (
            <option key={game.id} value={game.id}>
              {game.game_date} · vs {game.opponent}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={!gameId}
          className="rounded-md bg-sky-700 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          Load counts
        </button>
      </form>

      {!selectedGameId ? (
        <p className="mt-6 text-slate-600">
          Select a game to load aggregate counts.
        </p>
      ) : null}

      {selectedGame ? (
        <div className="mt-6 rounded-lg bg-slate-50 p-4">
          <div className="font-semibold text-slate-900">
            {selectedGame.game_date} · vs {selectedGame.opponent}
          </div>

          {selectedGame.venue ? (
            <div className="mt-1 text-sm text-slate-600">
              {selectedGame.venue}
            </div>
          ) : null}
        </div>
      ) : null}

      {selectedGameId && aggregatesQuery.isPending ? (
        <p className="mt-6">Loading aggregate counts...</p>
      ) : null}

      {selectedGameId && aggregatesQuery.isError ? (
        <p className="mt-6 text-rose-700">
          Unable to load aggregate counts.
        </p>
      ) : null}

      {selectedGameId &&
      aggregatesQuery.isSuccess &&
      aggregatesQuery.data.length === 0 ? (
        <p className="mt-6 text-slate-600">
          No event counts were found for this game.
        </p>
      ) : null}

      {selectedGameId &&
      aggregatesQuery.isSuccess &&
      aggregatesQuery.data.length > 0 ? (
        <table className="mt-6 min-w-full overflow-hidden rounded-lg border border-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Player</th>
              <th className="px-4 py-3 font-semibold">Events</th>
              <th className="px-4 py-3 font-semibold">Goals</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-700">
            {aggregatesQuery.data.map((row) => (
              <tr key={row.player_id}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {row.player_name}
                </td>
                <td className="px-4 py-3">{row.event_count}</td>
                <td className="px-4 py-3">{row.goal_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </main>
  )
}