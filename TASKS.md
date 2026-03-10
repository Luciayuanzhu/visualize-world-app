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
- [x] Add publish route to persist draft, scene transitions, mock segment start, and world-state snapshots

## Phase 3: Frontend MVP Shell

- [x] Build desktop app shell: TopBar, WorldPanel, TextPanel, Timeline
- [x] Build pre-world writing state
- [x] Build writing live state
- [x] Build sleeping / resuming / replay / error states
- [x] Build draft editor + evolve button states
- [x] Add mock session list and query-driven session state screens
- [x] Align replay header and manual scene controls with the writing-only MVP rules
- [x] Switch session list and session detail pages to prefer real Prisma-backed data
- [x] Wire Conjure World / Evolve / Start New Scene to real API actions
- [x] Make timeline scene thumbnails interactive for replay and back-to-current flow
- [x] Split draft editing state per scene and add previous-scene switching
- [x] Add optional scene title input with `Scene N` placeholder / auto-title fallback
- [x] Add previous / next scene arrows and editable session title with autosave semantics
- [x] Add session-list navigation from the in-session shell
- [x] Add Gemini-powered Continue / Polish actions to the draft header

## Phase 4: Integrations

- [x] Add browser-side Odyssey client wrapper
- [x] Add Gemini prompt client (mock scaffold)
- [x] Add frame capture and inactivity hooks
- [x] Add replay recording fetch flow
- [x] Add persistent sleep/wake routes and client flow
- [x] Move Gemini evolve/reconstruct to `gemini-2.5-flash`
- [x] Add Gemini-generated scene/world title fallback
- [x] Integrate the official Odyssey browser client package behind the local wrapper
- [x] Move publish/wake stream ownership to the browser with start-ack flow
- [x] Prevent live streams from visually falling back into replay when they end unexpectedly
- [x] Add browser-to-server client error logging for Odyssey/runtime issues
- [ ] Add real recording/finalizer flow beyond frame fallback

## Phase 5: Validation

- [x] Run local typecheck / lint
- [ ] Smoke-test core writing flow locally against Railway Postgres
- [x] Document env vars, interactions, and deployment steps
- [ ] Configure Railway pre-deploy migration and verify public routes

## Notes

- Current scope: writing-only MVP
- No reading mode
- No import flow
- Use this file to track progress after each coding step
