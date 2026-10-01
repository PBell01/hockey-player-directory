import { useState, type FormEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  useEventsWithPlayer,
  useGames,
  usePlayers,
} from '../../lib/scouting/hooks'
import { useCreateScoutingEvent } from '../../lib/scouting/mutation-hooks'

export const Route = createFileRoute('/scouting/events')({
  component: ScoutingEventsPage,
})

function ScoutingEventsPage() {
  const [playerFilter, setPlayerFilter] = useState('')
  const [gameFilter, setGameFilter] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState('')

  const [playerId, setPlayerId] = useState('')
  const [gameId, setGameId] = useState('')
  const [eventType, setEventType] = useState('')
  const [notes, setNotes] = useState('')

  const playersQuery = usePlayers()
  const gamesQuery = useGames()

  const eventsQuery = useEventsWithPlayer({
    ...(playerFilter ? { playerId: playerFilter } : {}),
    ...(gameFilter ? { gameId: gameFilter } : {}),
    ...(eventTypeFilter ? { eventType: eventTypeFilter } : {}),
  })

  const createEventMutation = useCreateScoutingEvent()

  const submitCreateEvent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    createEventMutation.mutate({
      player_id: playerId,
      game_id: gameId,
      event_type: eventType,
      notes: notes || null,
    })
  }

  const getPlayerName = (id: string) => {
    return playersQuery.data?.find((player) => player.id === id)?.name ?? id
  }

  const getGameLabel = (id: string) => {
    const game = gamesQuery.data?.find((item) => item.id === id)

    if (!game) {
      return `Game ${id}`
    }

    return `${game.game_date} · vs ${game.opponent}`
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">Scouting events</h1>

      <p className="mt-2 text-slate-600">
        Review observations and record an event for one player in one game.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <form
          className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-5"
          onSubmit={submitCreateEvent}
        >
          <h2 className="font-semibold text-slate-900">Create event</h2>

          <label className="block text-sm font-medium text-slate-700">
            Player
            <select
              value={playerId}
              onChange={(event) => setPlayerId(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2"
              required
            >
              <option value="">Select player</option>
              {playersQuery.data?.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} · {player.position} · {player.team_org_label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Game
            <select
              value={gameId}
              onChange={(event) => setGameId(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2"
              required
            >
              <option value="">Select game</option>
              {gamesQuery.data?.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.game_date} · vs {game.opponent}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Event type
            <input
              value={eventType}
              onChange={(event) => setEventType(event.target.value)}
              placeholder="goal, shot, hit..."
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional observation"
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2"
              rows={3}
            />
          </label>

          <button
            type="submit"
            disabled={createEventMutation.isPending}
            className="rounded-md bg-sky-700 px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {createEventMutation.isPending ? 'Saving...' : 'Create event'}
          </button>

          {createEventMutation.isSuccess &&
          createEventMutation.data.error === null ? (
            <p className="text-sm text-emerald-700">Event saved.</p>
          ) : null}

          {createEventMutation.isSuccess &&
          createEventMutation.data.error ? (
            <p className="text-sm text-rose-700">
              {createEventMutation.data.error.message}
            </p>
          ) : null}
        </form>

        <form
          className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-5"
          onSubmit={(event) => event.preventDefault()}
        >
          <h2 className="font-semibold text-slate-900">Filter events</h2>

          <label className="block text-sm font-medium text-slate-700">
            Player
            <select
              value={playerFilter}
              onChange={(event) => setPlayerFilter(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2"
            >
              <option value="">All players</option>
              {playersQuery.data?.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Game
            <select
              value={gameFilter}
              onChange={(event) => setGameFilter(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2"
            >
              <option value="">All games</option>
              {gamesQuery.data?.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.game_date} · vs {game.opponent}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Event type
            <input
              value={eventTypeFilter}
              onChange={(event) => setEventTypeFilter(event.target.value)}
              placeholder="goal, shot, hit..."
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2"
            />
          </label>
        </form>
      </div>

      {eventsQuery.isPending ? (
        <p className="mt-6">Loading events...</p>
      ) : null}

      {eventsQuery.isError ? (
        <p className="mt-6 text-rose-700">Unable to load events.</p>
      ) : null}

      {eventsQuery.isSuccess && eventsQuery.data.length === 0 ? (
        <p className="mt-6 text-slate-600">
          No events match these filters.
        </p>
      ) : null}

      {eventsQuery.isSuccess && eventsQuery.data.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {eventsQuery.data.map((scoutingEvent) => (
            <li
              key={scoutingEvent.id}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="font-semibold capitalize text-slate-900">
                {scoutingEvent.event_type.replaceAll('_', ' ')}
              </div>

              <div className="mt-1 text-sm text-slate-700">
                {getPlayerName(scoutingEvent.player_id)} ·{' '}
                {getGameLabel(scoutingEvent.game_id)}
              </div>

              {scoutingEvent.period || scoutingEvent.clock_time ? (
                <div className="mt-1 text-sm text-slate-500">
                  {scoutingEvent.period
                    ? `Period ${scoutingEvent.period}`
                    : ''}
                  {scoutingEvent.period && scoutingEvent.clock_time
                    ? ' · '
                    : ''}
                  {scoutingEvent.clock_time ?? ''}
                </div>
              ) : null}

              {scoutingEvent.notes ? (
                <div className="mt-2 text-sm text-slate-600">
                  {scoutingEvent.notes}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  )
}
