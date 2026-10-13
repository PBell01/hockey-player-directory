import { supabase } from '../supabase/client'

export type SignOutResult = { ok: true } | { ok: false; message: string }

export async function signOut(): Promise<SignOutResult> {
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true }
}
