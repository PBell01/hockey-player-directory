import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { supabase } from '../lib/supabase/client'
import { signOut } from '../lib/auth/sign-out'

export default function AuthNav() {
  const [email, setEmail] = useState<string | null>(null)
  const navigate = useNavigate()

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

  if (!email) {
    return (
      <Link to="/login" className="nav-link text-sm font-semibold">
        Login
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="hidden sm:inline text-[var(--sea-ink-soft)]">{email}</span>
      <button type="button" onClick={handleSignOut} className="nav-link font-semibold">
        Sign out
      </button>
    </div>
  )
}