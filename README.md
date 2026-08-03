# Bravely Done

**Small victories. Epic progress.**

Bravely Done is a game-first productivity platform for the web, Android, and iOS. Real responsibilities become quests, focused work becomes Adventure Sprints, and completing meaningful work visibly improves a living Base Camp.

The application is intentionally designed to feel like a game before it feels like project-management software. Agile planning, time tracking, personal coaching, team coordination, and optional SAFe-inspired structures operate beneath an approachable adventure interface.

## Product promise

A player should be able to:

1. Return to an animated Base Camp and meet a companion.
2. Capture or choose a real-life quest in seconds.
3. Complete a short Adventure Sprint.
4. Resolve the quest honestly: complete, continue, split, or retreat.
5. Receive XP, coins, loot, companion reactions, and visible world progress.
6. Close and reopen the application without losing state.

## Product pillars

- **Game first:** the primary interface is an adventure, not a decorated checklist.
- **Visible consequences:** completed work changes the player, companion, and world.
- **Reward brave behavior:** starting, planning, recovering, asking for help, and finishing all matter.
- **Forgiving motivation:** rest and comeback mechanics replace punitive streak loss.
- **Progressive complexity:** a quest can grow into a questline, campaign, party, guild, and optional SAFe hierarchy only when needed.
- **Private, helpful AI:** the companion learns useful patterns with transparent, editable memory; core play never requires AI.
- **Accessible excitement:** reduced-motion, screen-reader, keyboard, haptic, audio, and skip controls are part of the design.

## Current foundation

The repository currently contains:

- Nx 23 workspace
- Angular 22 frontend with SCSS
- NestJS 11 backend
- PostgreSQL 16 through Docker Compose
- Prisma 7 with a PostgreSQL driver adapter
- Initial `User`, `Role`, and revocable `Session` data models
- OpenAPI generation from NestJS and typed Angular client generation
- Jest unit-test coverage gates targeting 98%
- Playwright end-to-end foundation
- Angular, Nx, Playwright, GitHub, and Prisma MCP configuration
- FUN-factor and testing-quality gate documentation

The game loop, NgRx state, Three.js Base Camp, Capacitor packaging, reward economy, and companion AI are planned but not yet implemented.

## Planned architecture

| Concern                   | Technology                                                         |
| ------------------------- | ------------------------------------------------------------------ |
| Monorepo                  | Nx + pnpm                                                          |
| Web/mobile application    | Angular + TypeScript + RxJS + NgRx                                 |
| Native packaging          | Capacitor                                                          |
| 3D world                  | Three.js; Blender to glTF/GLB asset pipeline                       |
| API                       | NestJS + OpenAPI                                                   |
| Persistence               | PostgreSQL + Prisma                                                |
| Local browser persistence | IndexedDB/Dexie, added with offline support                        |
| Mobile persistence        | SQLite adapter, added with Capacitor                               |
| Tests                     | Jest, Playwright, Storybook when builder compatibility is resolved |
| Local AI                  | Native iOS/Android adapters plus deterministic fallback            |

## Repository layout

```text
apps/
  frontend/       Angular application
  frontend-e2e/   Playwright tests
  backend/        NestJS API and Prisma schema

documentation/    Product, architecture, quality, and development decisions
planning/         Checkbox-driven milestones and active delivery queues
docker/           Local PostgreSQL infrastructure
packages/         Shared and generated contracts
```

## Getting started

### Prerequisites

- Node.js compatible with Angular 22/Nx 23
- pnpm
- Docker Desktop
- Git

### Install

```powershell
pnpm install
Copy-Item .env.example .env
```

### Start PostgreSQL

```powershell
docker compose -f docker/docker-compose.yml up -d
```

### Generate Prisma client and apply migrations

```powershell
pnpm exec prisma generate --config apps/backend/prisma.config.ts
pnpm exec prisma migrate dev --config apps/backend/prisma.config.ts
```

### Run the applications

```powershell
pnpm nx serve @org/backend
pnpm nx serve frontend
```

The API is normally available at `http://localhost:3000/api`, Swagger at `http://localhost:3000/api-docs`, and the Angular app at `http://localhost:4200`.

### Generate the API contract and Angular client

```powershell
pnpm nx run @org/backend:generate-openapi
pnpm nx run frontend:generate-api
```

### Build and test

```powershell
pnpm nx run-many -t build lint test
pnpm nx e2e frontend-e2e
```

## Documentation

Start with:

- [Documentation index](documentation/README.md)
- [Product vision](documentation/product/vision.md)
- [Core game loop](documentation/product/game-loop.md)
- [Base Camp experience](documentation/product/base-camp.md)
- [System architecture](documentation/architecture/architecture.md)
- [Developer setup](documentation/development/getting-started.md)
- [FUN quality gate](documentation/quality-gates/fun-factor-gate.md)
- [Testing quality gate](documentation/quality-gates/testing-gate.md)

## Planning and status

- [Root TODO](TODO.md)
- [Planning index](planning/README.md)
- [Master plan](planning/00-master-plan.md)
- [Current work queue](planning/10-now-base-camp.md)

Checkbox notation:

- `[ ]` not started
- `[x]` complete and acceptance criteria satisfied

## Project status

The repository is in **foundation development**. The immediate objective is to create a browser-developed, mobile-sized vertical slice in which completing one mock quest triggers a performant Three.js celebration and permanently upgrades the Base Camp.

## License

MIT unless changed before public distribution.
