// Server gate for player and scouting-event ids.
// Other files import these functions. This file never uses the master database
// key and never creates tables. Row-level security stays the database backstop.
// Roles come from docs/security/role-access-matrix.md and
// docs/access/access-matrix-v2.md. The role is read from the signed-in user's
// own staff_profiles row on the server, never from the browser.

import { getAuthedServerClient, requireSession } from '../lib/auth/require-session'

// Plain identity of the person asking. Build it ONLY on the server, from the
// session, with getStaffActor(). Never from request input.
export type StaffActor = {
  staffId: string
  role: string
}

// Trusted boundary helper: resolves who is asking from the server session.
export async function getStaffActor(): Promise<StaffActor> {
  const user = await requireSession()
  const supabase = getAuthedServerClient()
  const { data: profile, error } = await supabase
    .from('staff_profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error || !profile) throw new ResourceNotFoundError()
  return { staffId: user.id, role: profile.role }
}

export type ResourceKind = 'player' | 'scouting_note'
export type ResourceAction = 'read' | 'create' | 'update' | 'delete'

export type StaffRole =
  | 'coaching'
  | 'scouting'
  | 'medical'
  | 'assistant_scout'
  | 'video_analyst'

// One error for every refusal, so a denied read and a missing read look the same.
// Callers should turn it into a "not found" answer.
export class ResourceNotFoundError extends Error {
  constructor() {
    super('Record not found')
    this.name = 'ResourceNotFoundError'
  }
}

// UUID shape only. Spaces, quotes, and semicolons never match.
const SAFE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function assertSafeIdentifier(rawId: unknown): string {
  if (typeof rawId !== 'string') throw new ResourceNotFoundError()
  const id = rawId.trim()
  if (!SAFE_UUID.test(id)) throw new ResourceNotFoundError()
  return id
}

// Which kinds of record each role may read. A role missing here reads nothing.
// scouting_note means a scouting_events row. Matrix v2: coaching is Deny.
// Assistant scout and video analyst have no "player" entry because neither
// matrix gives them a player row. See the open question in the notes.
const MAY_READ: Record<StaffRole, readonly ResourceKind[]> = {
  coaching: ['player'],
  scouting: ['player', 'scouting_note'],
  medical: ['player'],
  assistant_scout: ['scouting_note'],
  video_analyst: ['scouting_note'],
}

const MAY_WRITE: Record<StaffRole, readonly ResourceAction[]> = {
  coaching: [],
  scouting: ['create', 'update'],
  medical: [],
  assistant_scout: ['create'],
  video_analyst: [],
}

export function decideResourceAccess(role: unknown, kind: ResourceKind): 'allow' | 'deny' {
  if (typeof role !== 'string' || !Object.hasOwn(MAY_READ, role)) return 'deny'
  return MAY_READ[role as StaffRole].includes(kind) ? 'allow' : 'deny'
}

export async function authorizeResource(input: {
  kind: ResourceKind
  id: unknown
  action?: ResourceAction
  actor?: StaffActor
}): Promise<{ staffId: string; resourceId: string; role: string }> {
  // 1. Reject an unsafe id before anything touches the database.
  const resourceId = assertSafeIdentifier(input.id)

  // 2. Who is asking? Use the plain actor if given, otherwise the session.
  const actor = input.actor ?? (await getStaffActor())

  // 3. May this role do this action on this kind of record?
  //    No action means a read. Any action uses the write map.
  const allowed =
    input.action === undefined
      ? decideResourceAccess(actor.role, input.kind) === 'allow'
      : input.kind === 'scouting_note' &&
        Object.hasOwn(MAY_WRITE, actor.role) &&
        MAY_WRITE[actor.role as StaffRole].includes(input.action)
  if (!allowed) throw new ResourceNotFoundError()

  // 4. Object-level check, only when no actor was passed in and the record
  //    already exists. A create has no existing row to look up.
  if (!input.actor && input.action !== 'create') {
    const supabase = getAuthedServerClient()
    const lookup =
      input.kind === 'player'
        ? await supabase.from('players').select('id').eq('id', resourceId).maybeSingle()
        : await supabase.from('scouting_events').select('id').eq('id', resourceId).maybeSingle()
    if (lookup.error || !lookup.data) throw new ResourceNotFoundError()
  }

  return { staffId: actor.staffId, resourceId, role: actor.role }
}

// Collection-level gate: may this signed-in role read this KIND of record at all?
// Used where there is no single id (a list). Row-level security still filters rows.
export async function authorizeKind(kind: ResourceKind): Promise<{ staffId: string }> {
  const user = await requireSession()
  const supabase = getAuthedServerClient()

  const { data: profile, error } = await supabase
    .from('staff_profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error || !profile) throw new ResourceNotFoundError()

  if (decideResourceAccess(profile.role, kind) !== 'allow') {
    throw new ResourceNotFoundError()
  }
  return { staffId: user.id }
}