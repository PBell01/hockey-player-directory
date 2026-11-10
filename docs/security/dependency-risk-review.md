# Dependency and supply-chain risk review

Status: draft for the confidential-roster hostile review
Author: PBell01
Date: 2026-11-04

## What this note is

This note lists the libraries this hockey roster tool asks other people to write for us.
It tells stakeholders which supply-chain risks we accept for the hostile review, and which we do not.
It does not upgrade anything.

## Files read

- package.json (direct dependencies and devDependencies only)
- docs/security/attack-surface-map.md

## Changes we did not make

- Packages upgraded: no
- Lockfile changed: no (git status showed package.json and package-lock.json unmodified)
- npm audit fix or npm update run: no

## Direct dependencies

| Package name | dependencies or devDependencies | What it is for in this roster tool | Affects auth? | Affects HTML? | Affects server requests? | Why | Linked item on the attack-surface map |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @supabase/ssr | dependencies | Reads and writes the sign-in session cookie so the server can tell who is signed in. | yes | no | yes | Decides how the session reaches the server and Supabase. | Login; Scouting pages |
| @supabase/supabase-js | dependencies | Talks to the Supabase database and sign-in service for rosters, games, and scouting events. | yes | no | yes | Sends every database and sign-in request, including the provider-event writes. | Login; Events ingestion |
| @tailwindcss/vite | dependencies | Builds the page styling at build time. | no | no | no | Produces CSS only. It does not handle sign-in, data, or requests. | not on the map |
| @tanstack/history | dependencies | Tracks page address changes for the router. | no | no | no | Navigation bookkeeping only. | not on the map |
| @tanstack/react-devtools | dependencies | Developer debugging panel for the app. | no | yes | no | Adds an extra panel to the page. It should not ship to coaches in production. | not on the map |
| @tanstack/react-query | dependencies | Fetches and caches player, game, and scouting data in the browser. | no | no | yes | Sends the browser reads for the older scouting pages. | Scouting pages |
| @tanstack/react-router | dependencies | Maps addresses such as /players/{id} to pages. | no | yes | no | Decides which page is shown for an address. | Player URL; Scouting pages |
| @tanstack/react-router-devtools | dependencies | Developer panel that shows the route tree. | no | yes | no | Debug panel added to the page. | not on the map |
| @tanstack/react-start | dependencies | Runs the server side of the app, including the /api routes and the session check. | yes | yes | yes | Reads the session cookie, renders pages on the server, and receives the provider posts. | Events ingestion; Evaluations ingestion; Scouting pages |
| @tanstack/router-core | dependencies | Shared engine under the router and server rendering. | no | yes | yes | It prepares the page output and passes data between server and browser. | Scouting pages |
| react | dependencies | Builds every page. It escapes text such as scout notes by default. | no | yes | no | Controls how names and notes become HTML, which is why XSS is a risk only if raw HTML is used. | Scouting pages (XSS) |
| react-dom | dependencies | Puts the pages into the browser. | no | yes | no | Same reasoning as react. | Scouting pages (XSS) |
| tailwindcss | dependencies | Styling rules used in class names. | no | no | no | CSS only. | not on the map |
| @tailwindcss/typography | devDependencies | Styling for long text blocks, used at build time. | no | no | no | CSS only. | not on the map |
| @tanstack/devtools-vite | devDependencies | Connects the debug panel to the build tool. | no | no | no | Build and debug tooling. | not on the map |
| @tanstack/router-cli | devDependencies | Generates the route tree file. | no | no | no | Build-time tool. | not on the map |
| @types/node | devDependencies | Type information for Node, for the programmers only. | no | no | no | Not shipped. | not on the map |
| @types/react | devDependencies | Type information for React. | no | no | no | Not shipped. | not on the map |
| @types/react-dom | devDependencies | Type information for React DOM. | no | no | no | Not shipped. | not on the map |
| @vitejs/plugin-react | devDependencies | Lets the build tool compile React. | no | no | no | Build-time tool. | not on the map |
| nitro | devDependencies | Packages the server for Vercel. It is installed as the nightly build (npm:nitro-nightly@latest). | no | no | yes | It runs the server code that receives requests, but it sits in devDependencies even though it ships in the deployed server bundle. | Events ingestion; Evaluations ingestion |
| typescript | devDependencies | Checks the code for mistakes before it runs. | no | no | no | Not shipped. | not on the map |
| vite | devDependencies | Builds and serves the app. | no | no | no | Build-time tool. | not on the map |
| vitest | devDependencies | Runs the automated tests. | no | no | no | Test-only. | not on the map |

## Suggested audit findings (not applied)

I ran `npm audit` read-only. These are suggestions only.

| Package | Severity as reported | Plain-language meaning | Applied? |
| --- | --- | --- | --- |
| seroval | moderate | A library the framework uses to pass data between the server and the browser. Two advisories describe code or script injection through crafted data. The audit says a non-breaking fix exists. | no |
| postcss-selector-parser (through @tailwindcss/typography) | moderate | A styling build tool can be slowed by a crafted style rule. It runs at build time. The only listed fix is a breaking downgrade. | no |

## Risks accepted for the hostile review

- Accepted: the `postcss-selector-parser` advisory. Reason: it runs on our machine at build time and processes our own style files, not outside input. We would stop accepting it if styling is ever generated from user-entered text.
- Accepted: version ranges (the `^` marks) in package.json, with exact versions fixed by the lockfile. Reason: the lockfile records what was actually installed. We would stop accepting it if the lockfile is not committed or a build ignores it.
- Not accepted: the `seroval` advisory. It is used to carry data between server and browser, so it may be reached by real requests, and its advisories are about injected code or script. Next step: someone with the build in hand checks whether it is reachable in production and applies the non-breaking fix in a separate, tested change. Do not upgrade anything in this note.
- Not accepted: `nitro` installed as a nightly build. Nightly builds can change without a code change on our side, and this library runs the deployed server. Next step: pin to a released version in a later step.

## How a reviewer can check this note

1. Every package name in the table is a key in package.json.
2. No package name was added that is not in package.json.
3. package.json and the lockfile are unchanged after this note was written.