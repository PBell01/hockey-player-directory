// Server-only module: keep privileged directory access behind this boundary.

import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '../lib/supabase.server'

export type DirectoryRole = 'player' | 'staff' | 'all'

export type DirectoryInput = {
  search?: string
  role?: DirectoryRole
  limit?: number
}

export type DirectoryEntry = {
  id: string
  name: string
  role: Exclude<DirectoryRole, 'all'>
  position: 'F' | 'D' | 'G' | null
  number: number | null
  team: string
  status: 'active' | 'ir' | 'inactive'
}

export type DirectorySuccess = {
  ok: true
  entries: DirectoryEntry[]
}

export type DirectoryErrorCode = 'VALIDATION' | 'UPSTREAM' | 'INTERNAL'

export type DirectoryError = {
  ok: false
  code: DirectoryErrorCode
  message: string
}

export type DirectoryResponse = DirectorySuccess | DirectoryError

type DirectoryRow = {
  id: string
  full_name: string
  role: 'player' | 'staff'
  position_or_title: string
  jersey_number: number | string | null
  team_name: string | null
  is_active: boolean
}

const DEFAULT_LIMIT = 25
const MAX_SEARCH_LENGTH = 100
const MAX_LIMIT = 100

function escapeSearchTerm(value: string): string {
  return value.replace(/[\\%_(),"]/g, '\\$&')
}

function mapDirectoryRow(row: DirectoryRow): DirectoryEntry {
  const position = ['F', 'D', 'G'].includes(row.position_or_title)
    ? (row.position_or_title as DirectoryEntry['position'])
    : null
  const jerseyNumber = row.jersey_number === null ? null : Number(row.jersey_number)

  return {
    id: row.id,
    name: row.full_name,
    role: row.role,
    position,
    number: Number.isFinite(jerseyNumber) ? jerseyNumber : null,
    team: row.team_name ?? '',
    status: row.is_active ? 'active' : 'inactive',
  }
}

function validateDirectoryInput(input: unknown): DirectoryInput {
  if (input === null || typeof input !== 'object') {
    throw new Error('Directory input must be an object')
  }

  const candidate = input as Record<string, unknown>
  const search = candidate.search === undefined ? '' : candidate.search
  const role = candidate.role === undefined ? 'all' : candidate.role
  const limit = candidate.limit === undefined ? DEFAULT_LIMIT : candidate.limit

  if (typeof search !== 'string') {
    throw new Error('search must be a string')
  }

  const normalizedSearch = search.trim()
  if (normalizedSearch.length > MAX_SEARCH_LENGTH) {
    throw new Error('search must be 100 characters or fewer')
  }

  if (role !== 'player' && role !== 'staff' && role !== 'all') {
    throw new Error('role must be player, staff, or all')
  }

  if (
    typeof limit !== 'number' ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > MAX_LIMIT
  ) {
    throw new Error('limit must be an integer from 1 to 100')
  }

  return {
    search: normalizedSearch,
    role,
    limit,
  }
}

export const getDirectoryEntries = createServerFn({ method: 'GET' })
  .validator((input: unknown) => validateDirectoryInput(input))
  .handler(async ({ data }): Promise<DirectoryResponse> => {
    try {
      const client = getSupabaseServerClient()
      let query = client
        .from('directory_entries')
        .select(
          'id, full_name, role, position_or_title, jersey_number, team_name, is_active',
        )
        .limit(data.limit ?? DEFAULT_LIMIT)

      if (data.role !== 'all') {
        query = query.eq('role', data.role)
      }

      if (data.search) {
        const searchTerm = escapeSearchTerm(data.search)
        query = query.or(
          `full_name.ilike."%${searchTerm}%",team_name.ilike."%${searchTerm}%"`,
        )
      }

      const { data: rows, error } = await query

      if (error) {
        return {
          ok: false,
          code: 'UPSTREAM',
          message: 'Directory data could not be loaded',
        }
      }

      return {
        ok: true,
        entries: (rows as DirectoryRow[]).map(mapDirectoryRow),
      }
    } catch {
      return {
        ok: false,
        code: 'INTERNAL',
        message: 'Directory lookup failed',
      }
    }
  })
