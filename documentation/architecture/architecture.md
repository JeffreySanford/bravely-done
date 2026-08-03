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
