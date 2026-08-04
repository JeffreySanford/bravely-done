# Bravely Done TODO

This is the root status dashboard. Detailed acceptance criteria live in `planning/`.

## Current state

- [x] Create the Nx workspace.
- [x] Scaffold Angular frontend and NestJS backend.
- [x] Add Jest and Playwright foundations.
- [x] Add OpenAPI generation and typed Angular client generation.
- [x] Configure Angular, Nx, Playwright, GitHub, and Prisma MCP servers.
- [x] Add Docker Compose PostgreSQL 16.
- [x] Add Prisma 7 and PostgreSQL adapter.
- [x] Add initial user, role, and revocable session schema.
- [x] Add 98% coverage governance and testing-exception log.
- [x] Add FUN-factor quality gate.
- [x] Capture product, architecture, and milestone documentation.

## Next: stabilize the foundation

- [ ] Add root scripts: `serve:dev`, `serve:mobile`, `serve:api`, `db:up`, `db:down`, `db:migrate`, `api:generate`, `quality`.
- [ ] Add `.env.example` entries for database, auth, CORS, and frontend API URL.
- [ ] Add database health check and backend `/api/health` endpoint.
- [ ] Add consistent validation pipe, exception filter, logging, and request correlation.
- [ ] Add authentication endpoints and tests around the current User/Session schema.
- [ ] Add CI workflow running format, lint, typecheck, unit, coverage, build, and e2e.
- [ ] Resolve or formally defer Storybook builder compatibility.
- [ ] Add documentation-link validation and TODO consistency checks.

## Next: application shell

- [ ] Add NgRx Store and Effects using feature boundaries.
- [ ] Define durable domain state separately from render state.
- [ ] Add responsive phone-frame development harness.
- [ ] Add viewport, safe-area, reduced-motion, offline, and performance controls.
- [ ] Add route shell for Camp, Quest Board, Sprint, Chronicle, and Settings.
- [ ] Add design tokens and accessible shared UI primitives.

## Next: Character select and onboarding

- [x] Build auth/RBAC endpoints (JWT + DB-backed refresh sessions) and tests.
- [x] Build the Character data model (multiple characters per account) and creation endpoint.
- [x] Build character select as the app's actual landing page, gated so new users must complete
      character creation first. (Functional, styled placeholder — Three.js is the item below.)
- [x] Polish character select with Three.js, stylized sci-fi/cyber direction matching Ember. Ambient
      particle-field/orbit-ring WebGL backdrop behind the real interactive character cards, with
      motion-mode detection and a CSS fallback for no-WebGL browsers; verified live in-browser and via
      a 3-engine Playwright e2e test.

Plan 16 is complete — see [Plan 16](planning/16-character-select.md).

## Next: Base Camp Alive

- [x] Add Three.js and a renderer lifecycle service (shared with character select).
- [x] Render a primitive Base Camp: ground, lighting, an animated campfire (flame, embers, flickering
      light), and a tent that erects on arrival. Reachable at `/basecamp/:characterId` — clicking a
      character on character select, or finishing character creation, lands the character's avatar in
      Base Camp. Verified via a 3-engine Playwright e2e journey covering both entry paths.
- [ ] Add companion placeholder, quest board, chest, treasury, and bridge.
- [x] Add ambient animation and full/reduced/minimal motion modes (reuses the character-select scene's
      motion-mode plumbing).
- [ ] Add animation director driven by domain events.
- [ ] Gate the tent-erect animation to a character's true first-ever arrival (currently replays on
      every visit — needs durable per-character camp state, not just the rendering piece).
- [ ] Add choppable trees, foraging spots, wandering animals, and an animated stream/lake (see
      [Plan 02](planning/02-base-camp-animations.md)'s resource/survival loop).
- [ ] Complete one mock quest and visibly upgrade the camp.
- [ ] Persist and restore the upgrade through the API/PostgreSQL.
- [ ] Establish Android performance budgets before adding complex assets.

## Next: First Brave Step

- [ ] Create a quest in under 20 seconds.
- [ ] Run a resilient Adventure Sprint.
- [ ] Resolve complete, continue, split, or retreat.
- [ ] Grant deterministic XP, coins, and materials.
- [ ] Make reward application transactional and idempotent.
- [ ] Verify the complete loop through unit, API integration, and Playwright tests.

## Later milestones

- [ ] Daily, weekly, and monthly reward loops.
- [ ] Remote Ember LLM service (NestJS-connected), confidence-based autonomy, editable Hero Profile.
- [ ] Capacitor Android and iOS packaging.
- [ ] Parties (real-invited or matchmade), guilds, cooperative quests, and moderation.
- [ ] Questlines, campaigns, dependencies, risks, dual-labeled Agile/SAFe vocabulary by default, and the
      role/skill-tree system.

## Quality rules

- [ ] Every player-facing feature identifies its intended fun payoff.
- [ ] Every durable domain behavior has automated coverage.
- [ ] Coverage exceptions are recorded in `documentation/quality-gates/testing-exceptions.md`.
- [ ] Motion has reduced and minimal equivalents.
- [ ] The core quest/sprint loop must not require AI, a network, or social participation — this scopes
      to *basic productivity*, not a ban on Ember: Ember (the companion) is a deliberately remote,
      network-dependent service by design, and enhances the loop rather than gating it.
