# Player Parameter Design Notes

- Route file: `src/routes/players/$playerId.tsx`
- URL pattern: `/players/$playerId`
- Param name: `playerId`
- Validation: `playerId` must be a non-empty trimmed string.
- Player links use TanStack Router `Link` with `params={{ playerId }}`.

Bookmarkable player URLs give hockey operations staff a stable way to open, copy, and return to a specific player's detail page.
