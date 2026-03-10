# Visualize Writing-Only MVP

This repo is the writing-only MVP for Visualize.

Core flow:

- Create session
- Write draft
- Conjure World
- Evolve
- Start New Scene
- Sleep / Wake
- Replay

## Local setup

1. Copy `.env.example` to `.env.local`
2. Install dependencies with `npm install`
3. Run `npm run prisma:generate`
4. Run `npm run prisma:migrate`
5. Start the Next.js dev server with `npm run dev`

## Environment variables

- `DATABASE_URL`: Railway Postgres connection string
- `DEV_USER_ID`: temporary single-user auth fallback for MVP
- `ODYSSEY_API_KEY`: Odyssey server key
- `GEMINI_API_KEY`: Gemini server key

## Deployment target

- Runtime: Railway app service
- Database: Railway PostgreSQL
- Auth: `DEV_USER_ID` fallback only for MVP
- Storage / replay finalization: deferred until real Odyssey integration is wired

## Railway deploy flow

1. Push this repo to GitHub
2. Create a Railway project
3. Add one app service from the repo
4. Add one PostgreSQL service
5. Set `DATABASE_URL`, `DEV_USER_ID`, `ODYSSEY_API_KEY`, `GEMINI_API_KEY`
6. Generate a public domain for the app service
7. Set the app service Pre-deploy Command to `npm run prisma:deploy`
8. Open the deployed app and validate the demo routes
9. Verify `/sessions` and `/session/new` against the live database

## Interaction rules

- `Evolve` updates the current scene only.
- `Start New Scene` creates a new scene inside the same session and opens a fresh scene draft board.
- Each scene owns its own draft content and publish cursor.
- The left-arrow in the draft header switches back to the previous scene board.
- The right-arrow in the draft header switches forward to the next scene board.
- The first scene disables the left-arrow; the last scene disables the right-arrow.
- Scene navigation arrows let the user move across existing scene boards without leaving the session page.
- Every timeline card keeps its scene number visible (`Scene 1`, `Scene 2`, etc.); scene titles are secondary labels.
- Scene titles are optional user input. If the title input is left blank, the backend may auto-summarize a title when the scene is published.
- The top app title is editable. If it stays as `Untitled World`, the backend may auto-summarize it on publish.
- The TopBar always includes a `My Worlds` link back to the session list.
- The draft header includes Gemini-powered `Continue` and `Polish` actions with hover guidance.
- Timeline thumbnails are clickable; selecting a historical scene enters replay.
- Replay is memory-only and does not branch.
- `Back to Current` returns to the current scene's sleeping state.
- Scene history is world memory, not a separate writing document.
- Draft and title edits are autosaved. There is no separate `Save` button in MVP; `Evolve` is the explicit publish-to-world action.

## Current implementation status

- Session list and session detail pages are backed by Prisma on Railway Postgres.
- `Conjure World` / `Evolve` now use a real `/api/sessions/[id]/publish` route.
- `Start New Scene` persists a new scene, switches to a fresh draft board, and resets that scene to pre-world state.
- Scene titles are edited inline in the draft panel; blank titles fall back to the `Scene N` placeholder until publish.
- Session title is edited inline in the TopBar; `Untitled World` can be auto-filled on publish.
- Gemini 2.5 Flash now powers:
  - `Continue`
  - `Polish`
  - `Evolve` world compilation
  - `Reconstruct` for wake
  - scene title generation
  - world title generation
- Sleep persists a resumable prompt on the current scene and stores a frame-capture placeholder for replay/wake.
- Wake creates a new segment in the current scene and restores the world from the latest frame metadata.
- Replay resolves a recording URL when available and falls back to a frame-image route when not.
- Odyssey playback and recording are still mock-scaffolded until the browser integration path is finalized.

## Demo routes

- `/` landing
- `/sessions` real session list
- `/session/new` create-and-redirect route
- `/session/demo` demo pre-world writing
- `/session/demo?state=live` writing live
- `/session/demo?state=live&unpublished=0` writing live with disabled evolve
- `/session/demo?state=updating` updating
- `/session/demo?state=transitioning` transitioning
- `/session/demo?state=sleeping` sleeping
- `/session/demo?state=resuming` resuming
- `/session/demo?state=replay` replay writing
- `/session/demo?state=error` error

## Current note

The project skeleton was created manually because npm registry access was unavailable during bootstrapping.
Current AI/Odyssey integrations are mock scaffolds until dependencies are installed and real secrets are wired.
The official Odyssey npm package is temporarily excluded because its current peer range conflicts with React 19 / Next 15; real Odyssey integration will be wired separately once the browser integration path is finalized.
The session list and session detail pages now prefer real Prisma-backed data; the `demo` session remains available as a visual fallback route.
