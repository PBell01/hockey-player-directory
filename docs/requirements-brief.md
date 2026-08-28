Hockey Ops Player Directory — Requirements Brief
Overview

Hockey operations staff need a player directory that works well on arena Wi-Fi. The directory should show useful content when the page first loads instead of only showing a loading spinner. Each player should also have a link that can be bookmarked and shared.

Actors and goals

Hockey operations staff need to quickly view players and games. They should also be able to open and share a specific player's page.

Route map
/ — Home page
/players — Players list
/players/$playerId — Individual player page
/games — Games list
Data shown on first paint

The home page should show the directory title and links. The players page should show player names. The player page should show the player's information. The games page should show a list of games. This information should be included in the initial page instead of appearing only after a loading spinner.

Type-safe links and params

The player ID will be part of the URL, such as /players/42. Player links should work correctly and be bookmarkable. Invalid player IDs should show a safe not-found message.

Out of scope
User accounts and authentication
Live NHL data feeds
Editing or creating players
Payments or messaging
Mobile apps
Acceptance criteria
Visiting / shows useful directory content.
Visiting /players shows a list of players.
Visiting /players/42 shows a player page when that player exists.
A player URL can be bookmarked and opened again.
Visiting /games shows a list of games.
The initial page contains real content instead of only a loading spinner.