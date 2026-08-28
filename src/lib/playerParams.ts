export function parsePlayerIdParam(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('Player ID must be a non-empty string')
  }

  return value.trim()
}

export function playerDetailPath(playerId: string): string {
  return `/players/${encodeURIComponent(playerId)}`
}
