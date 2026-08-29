import { Link, useLocation } from '@tanstack/react-router'

export function AppNav() {
  const location = useLocation()
  const pathname = location.pathname

  const navLinkClass = (path: string) =>
    `rounded-md px-2 py-1 transition-colors ${
      pathname === path
        ? 'bg-sky-700 text-white shadow-sm'
        : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
    }`

  return (
    <nav
      aria-label="Main"
      className="flex flex-wrap gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium"
    >
      <Link to="/" className={navLinkClass('/')}>
        Home
      </Link>
      <Link to="/players" search={{ position: 'all', status: 'active' }} className={navLinkClass('/players')}>
        Players
      </Link>
      <Link to="/games" search={{ team: '', date: '' }} className={navLinkClass('/games')}>
        Games
      </Link>
    </nav>
  )
}
