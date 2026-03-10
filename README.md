# Visualize Writing-Only MVP

This repo is the writing-only MVP for Visualize.

Core flow:

- Create session
- Write draft
- Conjure World
- Evolve
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
7. Run `railway run npm run prisma:deploy`
8. Open the deployed app and validate the demo routes

## Demo routes

- `/` landing
- `/sessions` mock session list
- `/session/demo` pre-world writing
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
