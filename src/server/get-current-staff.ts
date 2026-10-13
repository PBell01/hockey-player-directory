import { createServerFn } from '@tanstack/react-start'
import { requireSession } from '../lib/auth/require-session'

export const getCurrentStaff = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ id: string; email: string | undefined }> => {
    const user = await requireSession()

    return {
      id: user.id,
      email: user.email,
    }
  },
)
