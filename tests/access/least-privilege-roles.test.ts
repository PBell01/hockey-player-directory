import { describe, it, expect } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Break-tests for docs/access/access-matrix-v2.md.
// Every attempt runs as a real test account using the public anon key.
// No service-role key, no policy changes, no GRANTs.

const env = (name: string): string | undefined =>
  process.env[name] ?? (import.meta.env as Record<string, string | undefined>)[name]

const url = env('VITE_SUPABASE_URL')
const anonKey = env('VITE_SUPABASE_ANON_KEY')

const accounts = {
  assistantScout: {
    email: env('TEST_ASSISTANT_SCOUT_EMAIL'),
    password: env('TEST_ASSISTANT_SCOUT_PASSWORD'),
  },
  videoAnalyst: {
    email: env('TEST_VIDEO_ANALYST_EMAIL'),
    password: env('TEST_VIDEO_ANALYST_PASSWORD'),
  },
  medical: {
    email: env('TEST_MEDICAL_EMAIL'),
    password: env('TEST_MEDICAL_PASSWORD'),
  },
}

const configured =
  !!url &&
  !!anonKey &&
  Object.values(accounts).every((a) => a.email && a.password)

// Untyped on purpose: medical_records and sports_science_records are logical
// names that are not in src/types/database.ts yet.
type AnyClient = SupabaseClient<any, 'public', any>

function newClient(): AnyClient {
  return createClient(url as string, anonKey as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function signedInClient(account: {
  email?: string
  password?: string
}): Promise<AnyClient> {
  const client = newClient()
  const { error } = await client.auth.signInWithPassword({
    email: account.email as string,
    password: account.password as string,
  })
  if (error) throw new Error(`Test account sign-in failed: ${error.message}`)
  return client
}

// Error codes that mean "that table does not exist", not "access refused".
const TABLE_MISSING_CODES = ['PGRST205', '42P01']

type Result = { data: unknown; error: { code?: string; message: string } | null }

function expectAllowed(res: Result) {
  expect(res.error, res.error?.message).toBeNull()
}

function expectAllowedWithRows(res: Result, target: string) {
  expect(res.error, res.error?.message).toBeNull()
  expect(
    Array.isArray(res.data) ? res.data.length : 0,
    `${target} returned no rows to a role that must be allowed`,
  ).toBeGreaterThan(0)
}

function expectDenied(res: Result, target: string) {
  if (res.error && TABLE_MISSING_CODES.includes(res.error.code ?? '')) {
    // A missing table is not a refusal. Fail instead of passing vacuously.
    throw new Error(
      `INCONCLUSIVE: ${target} does not exist, so this deny proves nothing yet.`,
    )
  }
  if (res.error) return // permission denied or similar: refused
  const rows = Array.isArray(res.data) ? res.data : res.data ? [res.data] : []
  expect(rows, `${target} returned rows to a role that must be denied`).toHaveLength(0)
}

const FLAG_PATTERN = /medical|injur|health|cleared|sports.?science/i

async function expectNoMedicalFlag(client: AnyClient) {
  for (const table of ['scouting_events', 'games']) {
    const res = await client.from(table).select('*')
    expectAllowed(res as Result)
    const keys = new Set<string>()
    for (const row of (res.data ?? []) as Record<string, unknown>[]) {
      Object.keys(row).forEach((k) => keys.add(k))
    }
    const leaked = [...keys].filter((k) => FLAG_PATTERN.test(k))
    expect(leaked, `medical-flag-like columns visible on ${table}`).toEqual([])
  }
}

const NIL_UUID = '00000000-0000-0000-0000-000000000000'

describe.skipIf(!configured)('least-privilege roles (access matrix v2)', () => {
  // ---- Allowed reads: the new jobs still work ----
  it('AS-READ-SCOUT: assistant scout reads scouting_events', async () => {
    const c = await signedInClient(accounts.assistantScout)
    expectAllowedWithRows(await c.from('scouting_events').select('*'), 'scouting_events')
  })

  it('AS-READ-GAME: assistant scout reads games', async () => {
    const c = await signedInClient(accounts.assistantScout)
    expectAllowedWithRows(await c.from('games').select('*'), 'games')
  })

  it('VA-READ-SCOUT: video analyst reads scouting_events', async () => {
    const c = await signedInClient(accounts.videoAnalyst)
    expectAllowedWithRows(await c.from('scouting_events').select('*'), 'scouting_events')
  })

  it('VA-READ-GAME: video analyst reads games', async () => {
    const c = await signedInClient(accounts.videoAnalyst)
    expectAllowedWithRows(await c.from('games').select('*'), 'games')
  })

  // ---- Assistant scout: sealed data ----
  it('AS-READ-MED: assistant scout cannot read medical_records', async () => {
    const c = await signedInClient(accounts.assistantScout)
    expectDenied(await c.from('medical_records').select('*'), 'medical_records')
  })

  it('AS-CHANGE-MED: assistant scout cannot change medical_records', async () => {
    const c = await signedInClient(accounts.assistantScout)
    expectDenied(
      await c.from('medical_records').update({ id: NIL_UUID }).neq('id', NIL_UUID).select(),
      'medical_records',
    )
  })

  it('AS-READ-SS: assistant scout cannot read sports_science_records', async () => {
    const c = await signedInClient(accounts.assistantScout)
    expectDenied(
      await c.from('sports_science_records').select('*'),
      'sports_science_records',
    )
  })

  it('AS-CHANGE-SS: assistant scout cannot change sports_science_records', async () => {
    const c = await signedInClient(accounts.assistantScout)
    expectDenied(
      await c
        .from('sports_science_records')
        .update({ id: NIL_UUID })
        .neq('id', NIL_UUID)
        .select(),
      'sports_science_records',
    )
  })

  // ---- Video analyst: sealed data (checked separately) ----
  it('VA-READ-MED: video analyst cannot read medical_records', async () => {
    const c = await signedInClient(accounts.videoAnalyst)
    expectDenied(await c.from('medical_records').select('*'), 'medical_records')
  })

  it('VA-CHANGE-MED: video analyst cannot change medical_records', async () => {
    const c = await signedInClient(accounts.videoAnalyst)
    expectDenied(
      await c.from('medical_records').update({ id: NIL_UUID }).neq('id', NIL_UUID).select(),
      'medical_records',
    )
  })

  it('VA-READ-SS: video analyst cannot read sports_science_records', async () => {
    const c = await signedInClient(accounts.videoAnalyst)
    expectDenied(
      await c.from('sports_science_records').select('*'),
      'sports_science_records',
    )
  })

  it('VA-CHANGE-SS: video analyst cannot change sports_science_records', async () => {
    const c = await signedInClient(accounts.videoAnalyst)
    expectDenied(
      await c
        .from('sports_science_records')
        .update({ id: NIL_UUID })
        .neq('id', NIL_UUID)
        .select(),
      'sports_science_records',
    )
  })

  // ---- Medical flags on the shared scouting screen's data ----
  it('AS-FLAG-SHARED: assistant scout sees no medical flag on shared scouting data', async () => {
    const c = await signedInClient(accounts.assistantScout)
    await expectNoMedicalFlag(c)
  })

  it('VA-FLAG-SHARED: video analyst sees no medical flag on shared scouting data', async () => {
    const c = await signedInClient(accounts.videoAnalyst)
    await expectNoMedicalFlag(c)
  })

  // ---- Control case ----
  it('MED-READ-MED: medical role CAN read medical_records (control)', async () => {
    const c = await signedInClient(accounts.medical)
    expectAllowedWithRows(await c.from('medical_records').select('*'), 'medical_records')
  })

  // ---- My added case ----
  it('ANON-READ-SCOUT: signed-out visitor cannot read scouting_events', async () => {
    const c = newClient() // anon key, no sign-in
    expectDenied(await c.from('scouting_events').select('*'), 'scouting_events')
  })
})