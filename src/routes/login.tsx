import { useState, type FormEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { signIn } from '../lib/auth/sign-in'
import { signOut } from '../lib/auth/sign-out'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = Route.useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    const result = await signIn(email, password)

    setIsSubmitting(false)

    if (!result.ok) {
      setErrorMessage(result.message)
      return
    }

    await navigate({ to: '/' })
  }

  const handleSignOut = async () => {
    setErrorMessage('')
    setIsSigningOut(true)

    const result = await signOut()

    setIsSigningOut(false)

    if (!result.ok) {
      setErrorMessage(result.message)
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold text-slate-900">Staff sign in</h1>
      <p className="mt-2 text-slate-600">
        Sign in to access the Hockey Operations Directory.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className="rounded-md border border-slate-200 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="rounded-md border border-slate-200 px-3 py-2"
          />
        </label>

        {errorMessage ? (
          <p role="alert" className="text-sm text-rose-700">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-sky-700 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="mt-4 w-full rounded-md border border-slate-200 px-4 py-2 font-medium text-slate-700 disabled:opacity-50"
      >
        {isSigningOut ? 'Signing out...' : 'Sign out'}
      </button>
    </main>
  )
}
