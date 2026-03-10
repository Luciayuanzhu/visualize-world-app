# Visualize Writing-Only MVP Task List

## Phase 0: Project Setup

- [x] Initialize Next.js 15 + TypeScript + Tailwind project
- [x] Add core dependencies: Prisma, Zustand, Zod, Gemini SDK, idb-keyval
- [x] Add baseline config files: `.env.example`, `.gitignore`, `README.md`
- [x] Create writing-only app directory structure from spec

## Phase 1: Contracts and Data Model

- [x] Add Prisma schema for sessions, scenes, segments, snapshots, revisions, jobs
- [x] Add shared TypeScript types for `ActionPlan`, `WorldState`, `LiveState`
- [x] Add Zod request/response schemas for MVP routes

## Phase 2: Backend MVP

- [x] Implement auth/session scaffolding
- [x] Implement session routes
- [x] Implement lease routes
- [x] Implement scene/segment routes
- [x] Implement AI evolve route
- [x] Implement AI reconstruct route
- [x] Implement storage signed URL routes
- [x] Replace mock session / scene / segment API handlers with Prisma-backed persistence

## Phase 3: Frontend MVP Shell

- [x] Build desktop app shell: TopBar, WorldPanel, TextPanel, Timeline
- [x] Build pre-world writing state
- [x] Build writing live state
- [x] Build sleeping / resuming / replay / error states
- [x] Build draft editor + evolve button states
- [x] Add mock session list and query-driven session state screens
- [x] Align replay header and manual scene controls with the writing-only MVP rules

## Phase 4: Integrations

- [x] Add browser-side Odyssey client wrapper (mock scaffold)
- [x] Add Gemini prompt client (mock scaffold)
- [x] Add frame capture and inactivity hooks
- [ ] Add replay recording fetch flow
- [ ] Revisit official Odyssey package integration once React 19 compatibility is confirmed

## Phase 5: Validation

- [x] Run local typecheck / lint
- [ ] Smoke-test core writing flow locally against Railway Postgres
- [x] Document env vars and deployment steps
- [ ] Configure Railway pre-deploy migration and verify public routes

## Notes

- Current scope: writing-only MVP
- No reading mode
- No import flow
- Use this file to track progress after each coding step
