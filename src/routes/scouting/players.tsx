import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { usePlayers } from '../../lib/scouting/hooks'

export const Route = createFileRoute('/scouting/players')({
  component: ScoutingPlayersPage,
})

function ScoutingPlayersPage() {
  const [position, setPosition] = useState('')
  const [teamOrgLabel, setTeamOrgLabel] = useState('')
  const playersQuery = usePlayers({
    ...(position ? { position } : {}),
    ...(teamOrgLabel ? { teamOrgLabel } : {}),
  })

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">Scouting players</h1>
      <p className="mt-2 text-slate-600">
        Filter the player records used by the Northline scouting workflow.
      </p>

      <form className="mt-6 flex flex-wrap gap-3" onSubmit={(event) => event.preventDefault()}>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Position
          <input
            value={position}
            onChange={(event) => setPosition(event.target.value)}
            className="rounded-md border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Team or organization
          <input
            value={teamOrgLabel}
            onChange={(event) => setTeamOrgLabel(event.target.value)}
            className="rounded-md border border-slate-200 px-3 py-2"
          />
        </label>
      </form>

      {playersQuery.isPending ? <p className="mt-6">Loading players...</p> : null}
      {playersQuery.isError ? (
        <p className="mt-6 text-rose-700">Unable to load players.</p>
      ) : null}
      {playersQuery.isSuccess && playersQuery.data.length === 0 ? (
        <p className="mt-6 text-slate-600">No players match these filters.</p>
      ) : null}
      {playersQuery.isSuccess && playersQuery.data.length > 0 ? (
        <ul className="mt-6 list-disc space-y-2 pl-5 text-slate-700">
          {playersQuery.data.map((player) => (
            <li key={player.id}>
              {player.name} · {player.position} · {player.team_org_label}
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  )
}
