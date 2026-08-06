# System Architecture

## Current foundation

- Nx workspace with Angular frontend and NestJS backend
- PostgreSQL in Docker Compose
- Prisma data access
- OpenAPI generated from backend controllers and DTOs
- Generated Angular API client
- Jest and Playwright quality foundations

## Target boundaries

```text
Angular UI and development harness
  -> NgRx feature state and effects
  -> generated OpenAPI client
  -> NestJS application services
  -> domain services and transaction boundaries
  -> Prisma repositories
  -> PostgreSQL

Domain events
  -> reward calculation
  -> persistence
  -> animation plans
  -> telemetry and Chronicle projection
```

## Real-time strategy

- **WebSockets** are the default for genuinely live, bidirectional needs: team quests, the portfolio
  cross-team dependency board, live scheduled ceremony events, and Ember's streaming responses.
- **SSE** is acceptable for simpler one-way server-push cases.
- **Angular signals** handle simple local reactive data flow (not a replacement for the above).
- UI enter/leave transitions use Angular's newer native `animate.enter`/`animate.leave` (CSS-driven),
  not the heavier `@angular/animations` package — distinct from the Three.js scene-animation layer
  covered in the Base Camp planning docs.

## API operational contract

Three cross-cutting behaviors apply to every backend endpoint:

- **Validation** — a global `ValidationPipe` (`whitelist` + `transform`) rejects unknown properties
  rather than silently accepting them.
- **One error shape** — `ApiExceptionFilter` (`apps/backend/src/common/`) returns
  `{ statusCode, message, error, requestId, path, timestamp }` for every failure, plus `details[]` for
  field-level validation errors. `message` is always a string (never an array), because the frontend
  reads it directly to surface real, user-actionable failures. Unhandled errors never expose their own
  message — that can carry connection strings, SQL, or file paths — and are logged server-side with the
  `requestId` instead. Only 5xx logs at error level; a 4xx means the API rejected bad input correctly.
- **Request correlation** — every response carries an `x-request-id`, honoring an inbound one when a
  caller or proxy supplies it. `RequestIdInterceptor` covers successes, the exception filter covers
  failures, so nothing leaves without one.

`GET /api/health` (unauthenticated, so probes can reach it) reports liveness plus dependency
readiness, running a real database round trip rather than trusting connection state — Prisma connects
once at startup, so a client that has since lost Postgres would otherwise still look connected. It
answers **503**, not 500, when a dependency is down: the API is working, it just can't serve traffic.

## Unified event logging

Still to build. Today the backend uses Nest's default `Logger` with correlation ids (above), not a
structured JSON stream. The intended design: an interceptor-driven logger (NestJS interceptors backend,
Angular interceptors frontend) capturing a **single unified stream** of both domain/game events (quest
completions, level-ups, role switches, Ember autonomy decisions) and technical events (API
requests/errors, auth events) — one stream,
filterable by category, not two separate systems. It serves **both** admin observability and
user-facing features (activity feed, audit trail) — the schema is designed for both audiences from the
start. The WebSocket-first real-time strategy above lets the same captured events be broadcast live to
activity feeds rather than building a second event system.

## External integrations

The player's own tasks are natively owned by Bravely Done's Postgres-backed data model (source of
truth). External PM tools sync data **in** as an additional input source; Bravely Done is not a thin
lens over someone else's data. The first planned external integration is the **Basecamp Connector** —
syncing with the third-party Basecamp tool, built in Three.js/UI once the core framework is stable. See
the [glossary](../product/glossary.md#disambiguation-base-camp-vs-basecamp-connector) — this is
unrelated to **Base Camp**, the game's own hub.

## State ownership

- PostgreSQL is authoritative for synchronized durable state.
- NgRx is the frontend coordination and cache layer.
- Three.js owns ephemeral render objects and frame state.
- Domain time derives from timestamps and lifecycle events, never frame counts.
- Offline storage is introduced through repositories and an outbox, not direct component persistence.

## Planned libraries

- `domain-quests`
- `domain-sprints`
- `domain-rewards`
- `domain-camp`
- `domain-community`
- `data-access-api`
- `data-access-offline`
- `game-rendering`
- `game-animation`
- `companion-core`
- `ui-*`
