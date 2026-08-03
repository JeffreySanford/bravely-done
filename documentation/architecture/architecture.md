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

## Unified event logging

An interceptor-driven logger (NestJS interceptors backend, Angular interceptors frontend) captures a
**single unified stream** of both domain/game events (quest completions, level-ups, role switches,
Ember autonomy decisions) and technical events (API requests/errors, auth events) — one stream,
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
