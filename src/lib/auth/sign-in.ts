import { supabase } from '../supabase/client'

export type SignInResult = { ok: true } | { ok: false; message: string }

export async function signIn(
  email: string,
  password: string,
): Promise<SignInResult> {
  const trimmedEmail = email.trim()

  if (!trimmedEmail || !password) {
    return { ok: false, message: 'Email and password are required.' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  })

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true }
}
