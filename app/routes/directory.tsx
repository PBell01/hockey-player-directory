import { Link, createFileRoute } from '@tanstack/react-router'
import {
  getDirectoryEntries,
  type DirectoryRole,
} from '../server/directory'

export type DirectorySearch = {
  search: string
  role: DirectoryRole
  limit: number
}

function validateDirectorySearch(search: Record<string, unknown>): DirectorySearch {
  const role = search.role === 'player' || search.role === 'staff' ? search.role : 'all'
  const limit =
    typeof search.limit === 'number' && Number.isInteger(search.limit)
      ? search.limit
      : 25

  return {
    search: typeof search.search === 'string' ? search.search : '',
    role,
    limit,
  }
}

export const Route = createFileRoute('/directory')({
  validateSearch: (search) => validateDirectorySearch(search),
  loader: ({ location }) =>
    getDirectoryEntries({ data: validateDirectorySearch(location.search) }),
  pendingComponent: DirectoryLoadingState,
  errorComponent: DirectoryLoadError,
  component: DirectoryPage,
})

function DirectoryLoadingState() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-slate-600">
        Loading directory entries...
      </div>
    </main>
  )
}

function DirectoryLoadError() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-900">
        <h1 className="font-semibold">Directory unavailable</h1>
        <p className="mt-1 text-sm">Please try again shortly.</p>
      </div>
    </main>
  )
}

function DirectoryPage() {
  const search = Route.useSearch()
  const response = Route.useLoaderData()

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">
            Hockey Operations
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Directory
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Current players and staff available to operations teams.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            to="/directory"
            search={{ ...search, role: 'all' }}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Everyone
          </Link>
          <Link
            to="/directory"
            search={{ ...search, role: 'player' }}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Players
          </Link>
          <Link
            to="/directory"
            search={{ ...search, role: 'staff' }}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Staff
          </Link>
        </div>
      </div>

      {!response.ok ? (
        <div className="mt-8 rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-900">
          <h2 className="font-semibold">Directory unavailable</h2>
          <p className="mt-1 text-sm">{response.message}</p>
        </div>
      ) : response.entries.length === 0 ? (
        <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            No directory entries found
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Try another directory view or clear the current filters.
          </p>
          <Link
            to="/directory"
            search={{ search: '', role: 'all', limit: 25 }}
            className="mt-4 inline-flex font-medium text-sky-700 underline underline-offset-4"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Position</th>
                  <th className="px-5 py-3 font-semibold">Team</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {response.entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900">
                      {entry.name}
                    </td>
                    <td className="px-5 py-4 capitalize">{entry.role}</td>
                    <td className="px-5 py-4">
                      {entry.position ?? 'Staff'}
                      {entry.number === null ? '' : ` · #${entry.number}`}
                    </td>
                    <td className="px-5 py-4">{entry.team || 'Unassigned'}</td>
                    <td className="px-5 py-4 capitalize">{entry.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  )
}
