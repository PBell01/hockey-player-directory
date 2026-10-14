import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@tanstack/react-start/server', () => ({
  getRequestHeader: vi.fn(() => ''),
}))

vi.mock('../supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}))

import { requireSession } from './require-session'
import { createSupabaseServerClient } from '../supabase/server'

describe('requireSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the authenticated staff identity when a session exists', async () => {
    const mockUser = {
      id: 'staff-user-uuid-1',
      email: 'scout@example.com',
    }

    vi.mocked(createSupabaseServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: mockUser } },
          error: null,
        }),
      },
    } as never)

    const session = await requireSession()

    expect(session.id).toBe('staff-user-uuid-1')
    expect(session.email).toBe('scout@example.com')
  })

  it('throws when there is no authenticated session', async () => {
    vi.mocked(createSupabaseServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        }),
      },
    } as never)

    await expect(requireSession()).rejects.toThrow('Unauthorized: sign in required')
  })

  it('throws clearly when Supabase returns a session error', async () => {
    vi.mocked(createSupabaseServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: { message: 'network error' },
        }),
      },
    } as never)

    await expect(requireSession()).rejects.toThrow(/Unable to read authentication session/)
  })
})