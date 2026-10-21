import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { supabase } from '../lib/supabase/client'
import { signOut } from '../lib/auth/sign-out'

export function AppNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await signOut()
    setEmail(null)
    navigate({ to: '/login' })
  }

  const navLinkClass = (path: string) =>
    `rounded-md px-2 py-1 transition-colors ${
      pathname === path
        ? 'bg-sky-700 text-white shadow-sm'
        : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
    }`

  return (
    <nav
      aria-label="Main"
      className="flex flex-wrap items-center gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium"
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
      <Link to="/scouting" className={navLinkClass('/scouting')}>
        Scouting
      </Link>

      <div className="ml-auto flex items-center gap-3">
        {email ? (
          <>
            <span className="hidden text-slate-600 sm:inline">{email}</span>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-md px-2 py-1 text-slate-700 transition-colors hover:bg-slate-200 hover:text-slate-900"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link to="/login" className={navLinkClass('/login')}>
            Login
          </Link>
        )}
      </div>
    </nav>
  )
}