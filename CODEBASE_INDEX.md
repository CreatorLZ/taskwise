# Taskwise Codebase Index

Last indexed: 2026-05-22

## Product Snapshot

Taskwise is an AI-assisted task management app with email/password auth, Google auth, task CRUD, NLP task creation, AI prioritization, task reminders, push notifications, recurring tasks, productivity insights, and a PWA-enabled React frontend.

## Repository Layout

- `client/` - Vite + React + TypeScript frontend.
- `client/src/Pages/` - route-level screens: landing, auth, dashboard, todo list, password reset, email verification.
- `client/src/components/` - app shell, task UI, loading/empty/error states, and feature widgets.
- `client/src/components/ui/` - shadcn/Radix-style primitives plus app-specific UI modules such as new task, Pomodoro timer, search, keyboard shortcuts, notification prompt.
- `client/src/store/` - Zustand stores and React Query hooks for auth and task data.
- `client/src/utils/api.tsx` - shared Axios client and auth interceptor.
- `client/public/` - PWA manifest, Firebase messaging worker, app images/icons.
- `server/src/` - Express + TypeScript backend.
- `server/src/server.ts` - app bootstrap, middleware, route mounting, cron startup.
- `server/src/models/` - Mongoose `User` and `Task` schemas.
- `server/src/controllers/` - auth, Google auth, and task controller logic.
- `server/src/routes/` - API route definitions.
- `server/src/middleware/` - JWT auth, Zod validation, rate limiting.
- `server/src/services/` - Gemini, email, recurrence, and security services.
- `server/src/utils/` - AI/NLP/task insight helpers, JWT, notifications, time progress.
- `server/src/cron/` - reminder, recurrence, and task analysis schedulers.

## Runtime Architecture

Frontend:

- React 18, Vite, TypeScript, Tailwind, Radix UI/shadcn components.
- React Router handles public and protected routes.
- Zustand persists auth/task state to `localStorage`.
- React Query fetches and mutates server data.
- Axios attaches JWT bearer tokens from the auth store.
- Firebase Messaging supports browser push notifications.
- Vite PWA plugin builds service worker assets.

Backend:

- Express API with MongoDB via Mongoose.
- JWT authentication in `authenticateUser`.
- Helmet, CORS, JSON body limits, and Express rate limit are configured globally.
- Gemini powers NLP task creation, AI prioritization, and user insights.
- Nodemailer/Resend-related code sends reminder, verification, and password reset emails.
- Cron jobs run inside the API process for reminders, recurrence generation, and task analysis restoration.

## Primary API Surface

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- Google auth routes are also mounted at `/api/auth`.

Tasks:

- `GET /api/tasks/user/:userId`
- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `PATCH /api/tasks/:id/complete`

AI and insights:

- `POST /api/create-from-nlp`
- `POST /api/prioritize-tasks`
- `GET /api/insights`
- task analysis enable/disable routes are mounted from `server/src/routes/taskAnalysis.ts`.

Users:

- `PUT /api/users/update-fcm-token`

## Data Model Highlights

`User` includes username, email, password hash, failed-login lockout fields, FCM token, Google profile fields, email verification tokens, password reset tokens, and task analysis schedule settings.

`Task` includes title, description, completion/status/priority, due date/time, reminder state, AI retouching logs, tags/category, subtasks, recurrence settings, time tracking, parent recurring task links, and notification state.

Useful MongoDB indexes already exist for user-owned task queries by due date, status, completion, tags, category, and recurrence schedule.

## Current Strengths

- The product scope is coherent: tasks, reminders, AI assistance, and productivity insights belong together.
- TypeScript strict mode is enabled in both client and server configs.
- Auth has recent hardening work: Zod validation, account lockouts, email verification, password reset, audit logging, rate limiting.
- Task model has grown toward production features: subtasks, tags, categories, recurrence, time tracking, notification state.
- Frontend has a usable architecture with route guards, shared API client, React Query, persistent stores, and reusable UI primitives.

## Production Risks To Address First

1. Authorization gaps: task routes fetch/update/delete by `userId` params or task id without consistently proving the task belongs to the authenticated user. The backend should derive user identity from the JWT and include `userId: req.user.id` in every task query.
2. Input validation is incomplete: task, NLP, user, verification, and FCM routes have schemas available or needed, but several routes still accept raw bodies.
3. Generated artifacts appear tracked: `server/dist`, `*.tsbuildinfo`, and a Vite timestamp file are present. Add a root `.gitignore` and remove generated files from version control in a dedicated cleanup.
4. Secrets/config validation is missing: required env vars such as `PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRATION`, `GEMINI_API_KEY`, Firebase, email, CORS, and client URL should be validated at startup.
5. Server bootstrapping mixes app creation and listen side effects, making integration tests harder. Split `createApp()` from `listen()`.
6. Cron jobs run in-process on every server instance. That can duplicate reminders/recurrence generation after horizontal scaling.
7. Observability is console-based. Replace production `console.log` paths with structured logging and request correlation.
8. No first-party tests were found under `client/src` or `server/src`.
9. README is stale: it references Hugging Face while current code uses Gemini, and some markdown/encoding is broken.
10. Client auth stores JWT in `localStorage`, which is simple but vulnerable to token theft through XSS. Decide whether to move to secure, httpOnly cookies or strengthen CSP/XSS controls.

## Verification Snapshot

Commands run during indexing:

- `npx.cmd tsc --noEmit` in `server/` passed.
- `npm.cmd run lint` in `client/` failed with 25 errors and 7 warnings.

Current client lint themes:

- `no-explicit-any` in auth pages, Google sign-in, sidebar, new task UI, and auth store.
- Unused imports/variables in `VerifyEmail.tsx`, `PomodoroTimer.tsx`, `SearchDialog.tsx`, and `newTask.tsx`.
- `no-case-declarations` in `Dashboard.tsx`.
- Empty object patterns in `components/ui/calendar.tsx`.
- React hook dependency warnings in `Dashboard.tsx`.
- Fast refresh export warnings in shared UI primitive files.

No first-party test files were found under `client/src` or `server/src`.

## Recommended Hardening Backlog

### Phase 1 - Safety and Correctness

- Lock all task and user mutations to authenticated ownership.
- Apply Zod validation to task, NLP, user, verification, and FCM routes.
- Add centralized async error handling and consistent API error responses.
- Validate environment variables once at startup.
- Fix `.gitignore` and stop tracking generated files.
- Add server unit/integration tests for auth, task ownership, task validation, NLP validation, and password reset flows.

### Phase 2 - Production Readiness

- Split server app construction from process startup for testability.
- Add structured logging, request ids, and production-safe error messages.
- Move cron work to a single worker process or external scheduler.
- Add CI for client lint/build, server typecheck/build, and tests.
- Add dependency/security audit workflow.
- Document deployment environment variables and local setup accurately.

### Phase 3 - Product Quality

- Tighten task UX around recurrence, subtasks, search, keyboard shortcuts, Pomodoro, and notifications.
- Align frontend task types with backend schema so new fields are first-class.
- Add optimistic updates and clear loading/error states where missing.
- Add accessibility checks for dialogs, keyboard flows, and form errors.
- Add analytics events for activation and retention-critical flows.

## First Implementation Candidates

The best first production-grade improvement is task ownership enforcement. It has high security impact, small scope, and can be verified with focused tests. After that, add route validation and server app/test setup.
