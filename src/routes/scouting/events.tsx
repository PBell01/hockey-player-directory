import { useState, type FormEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useCreateScoutingEvent } from '../../lib/scouting/mutation-hooks'
import { useEvents } from '../../lib/scouting/hooks'

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

  const eventsQuery = useEvents({
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

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">Scouting events</h1>
      <p className="mt-2 text-slate-600">
        Review observations and record an event for one player in one game.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <form className="space-y-3 rounded-md bg-slate-100 p-4" onSubmit={submitCreateEvent}>
          <h2 className="font-semibold text-slate-900">Create event</h2>
          <input
            value={playerId}
            onChange={(event) => setPlayerId(event.target.value)}
            placeholder="Player ID"
            aria-label="Player ID"
            className="w-full rounded-md border border-slate-200 px-3 py-2"
          />
          <input
            value={gameId}
            onChange={(event) => setGameId(event.target.value)}
            placeholder="Game ID"
            aria-label="Game ID"
            className="w-full rounded-md border border-slate-200 px-3 py-2"
          />
          <input
            value={eventType}
            onChange={(event) => setEventType(event.target.value)}
            placeholder="Event type"
            aria-label="Event type"
            className="w-full rounded-md border border-slate-200 px-3 py-2"
          />
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notes (optional)"
            aria-label="Notes"
            className="w-full rounded-md border border-slate-200 px-3 py-2"
          />
          <button
            type="submit"
            disabled={createEventMutation.isPending}
            className="rounded-md bg-sky-700 px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {createEventMutation.isPending ? 'Saving...' : 'Create event'}
          </button>
          {createEventMutation.isSuccess && createEventMutation.data.error === null ? (
            <p className="text-sm text-emerald-700">Event saved.</p>
          ) : null}
          {createEventMutation.isSuccess && createEventMutation.data.error ? (
            <p className="text-sm text-rose-700">{createEventMutation.data.error.message}</p>
          ) : null}
        </form>

        <form className="space-y-3 rounded-md bg-slate-100 p-4" onSubmit={(event) => event.preventDefault()}>
          <h2 className="font-semibold text-slate-900">Filter events</h2>
          <input
            value={playerFilter}
            onChange={(event) => setPlayerFilter(event.target.value)}
            placeholder="Player ID"
            aria-label="Filter by player ID"
            className="w-full rounded-md border border-slate-200 px-3 py-2"
          />
          <input
            value={gameFilter}
            onChange={(event) => setGameFilter(event.target.value)}
            placeholder="Game ID"
            aria-label="Filter by game ID"
            className="w-full rounded-md border border-slate-200 px-3 py-2"
          />
          <input
            value={eventTypeFilter}
            onChange={(event) => setEventTypeFilter(event.target.value)}
            placeholder="Event type"
            aria-label="Filter by event type"
            className="w-full rounded-md border border-slate-200 px-3 py-2"
          />
        </form>
      </div>

      {eventsQuery.isPending ? <p className="mt-6">Loading events...</p> : null}
      {eventsQuery.isError ? (
        <p className="mt-6 text-rose-700">Unable to load events.</p>
      ) : null}
      {eventsQuery.isSuccess && eventsQuery.data.length === 0 ? (
        <p className="mt-6 text-slate-600">No events match these filters.</p>
      ) : null}
      {eventsQuery.isSuccess && eventsQuery.data.length > 0 ? (
        <ul className="mt-6 space-y-2 text-slate-700">
          {eventsQuery.data.map((scoutingEvent) => (
            <li key={scoutingEvent.id} className="rounded-md border border-slate-200 p-3">
              {scoutingEvent.event_type} · player {scoutingEvent.player_id} · game{' '}
              {scoutingEvent.game_id}
              {scoutingEvent.notes ? ` · ${scoutingEvent.notes}` : ''}
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  )
}
