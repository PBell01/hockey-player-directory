import { Link } from '@tanstack/react-router'

export function AppNav() {
  return (
    <nav
      aria-label="Main"
      className="flex flex-wrap gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium"
    >
      <Link to="/">Home</Link>
      <Link to="/players">Players</Link>
      <Link to="/games">Games</Link>
    </nav>
  )
}
