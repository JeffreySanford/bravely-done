# Plan 01: Foundation

## Developer workflow

- [x] Add root pnpm scripts for frontend, mobile harness, API, database, generation, and quality:
      `serve:web`, `serve:api`, `serve:apps`, `db:up`/`db:down`/`db:generate`/`db:migrate`,
      `api:generate`, `quality`, `e2e`, and `start:all` (database up → generate → migrate → serve).
      No mobile-harness script — Capacitor doesn't exist yet, so one would be a script pointing at
      nothing (see [Plan 06](06-mobile-platforms.md)).
- [ ] Add environment validation. `.env.example` now documents every required variable and why
      (`DATABASE_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN`, `PORT`), but nothing _validates_ them at boot —
      a missing `JWT_SECRET` still fails at provider-construction time rather than with a clear
      "not configured" message.
- [x] Add workspace format checks — `nx format:check` runs in CI and in `pnpm quality`. Documentation-
      link checking is still open (tracked in TODO.md).
- [x] Add CI workflow for lint, test, build, and e2e (`.github/workflows/ci.yml`), against a real
      Postgres service container and covering both the backend integration tier and the 3-engine
      Playwright suite. It runs the full set rather than only affected projects — the workspace is small
      enough that the simplicity is worth more than the saved minutes. No coverage gate yet.
- [ ] Add dependency update policy.

## Backend

- [x] NestJS application exists.
- [x] PostgreSQL Docker Compose exists.
- [x] Prisma service and initial schema exist.
- [x] Add health controller with database probe — `GET /api/health` (`apps/backend/src/health/`) runs a
      real `SELECT 1` and returns 503 rather than 500 when the database is unreachable, so a probe can
      distinguish "can't serve traffic" from "crashed". Verified live by stopping the Postgres container
      mid-run and watching it flip and then recover.
- [x] Add global validation and error contract — `ValidationPipe` (whitelist + transform) plus
      `ApiExceptionFilter`, which gives every error one shape and never leaks an unhandled error's own
      message. See TODO.md's foundation section for the full contract.
- [x] Add correlation IDs — `RequestIdInterceptor` on success, `ApiExceptionFilter` on error, both
      honoring an inbound `x-request-id` and echoing it back. Logging is still Nest's default `Logger`
      rather than a structured JSON logger; that's the remaining half of this item.
- [x] Implement authentication/session endpoints — signup/login/refresh/logout/me with JWT access
      tokens and DB-backed revocable refresh sessions (only a hash of each refresh token is stored).
- [x] Add API integration-test database lifecycle — `apps/backend-e2e` runs against the real running
      backend and a real Postgres. Each test signs up its own user rather than sharing fixtures, which
      keeps them independent without needing per-test truncation.

## Frontend

- [x] Angular application exists.
- [x] Add NgRx Store/Effects — four feature slices (quests, camp, sprints, encounters).
- [x] Add environment-based API configuration (`apps/frontend/src/environments/environment.ts` →
      `provideApiConfiguration`).
- [ ] Add route shell and responsive layout. Routes exist for signup/login/character-select/character-
      create/base-camp, but there's no shell for Camp / Quest Board / Sprint / Chronicle / Settings —
      the quest board is an overlay inside the Base Camp route, not its own destination.
- [ ] Add mobile development harness.
- [ ] Add shared design tokens and accessible primitives. Global CSS custom properties
      (`--bd-cyan`, `--bd-surface`, …) and `.bd-button`/`.bd-field` classes exist in
      `apps/frontend/src/styles.scss` and are used consistently, but they aren't a documented token set
      or a component library.

## Acceptance

- [x] A clean checkout can start Postgres, migrate, serve API and frontend, generate contracts, and
      pass quality checks using documented commands: `pnpm install`, then `pnpm start:all` to bring
      everything up, `pnpm api:generate` to regenerate the typed client from the OpenAPI contract, and
      `pnpm quality` to run the same gates CI does.
