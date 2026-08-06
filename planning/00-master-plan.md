# Bravely Done Master Plan

## Product definition

- [x] Select Bravely Done and the tagline “Small victories. Epic progress.”
- [x] Define game-first product principles.
- [x] Define Base Camp as the primary game surface.
- [x] Define mobile-first, web-developed delivery.
- [x] Capture AI, return rewards, community, agile, and SAFe directions.

## Milestone 0: Full-stack foundation

- [x] Create Nx workspace.
- [x] Scaffold Angular and NestJS applications.
- [x] Add OpenAPI client generation.
- [x] Add PostgreSQL and Prisma.
- [x] Add MCP configuration.
- [x] Add initial quality gates.
- [x] Finish developer scripts and CI. `pnpm quality` mirrors CI's gates locally; CI itself runs
      format/lint/typecheck/unit/build plus both e2e tiers against a real Postgres. A coverage gate is
      still unwired (see TODO.md).
- [x] Add authentication and health foundations. JWT + DB-backed revocable refresh sessions;
      `GET /api/health` with a real database round trip, a global exception filter, and request
      correlation ids.
- [x] Establish clean lint, test, build, e2e, and migration baseline.

## Milestone 1: Base Camp Alive

- [x] Render responsive Three.js camp in browser phone harness. (The camp renders responsively and is
      verified across three browser engines; the dedicated _phone-frame dev harness_ was never built —
      see TODO.md's application-shell section.)
- [x] Add ambient scene and companion placeholder. The companion's glow and liveliness scale with real
      gathered forage, so it's a resource sink rather than decoration.
- [x] Implement quest-accepted, sprint, and completion choreography. (Completion, chopping, foraging,
      upkeep, workbench, and a calm sprint-focus halo are wired through the animation director;
      quest-accepted and loot-reveal are still open.)
- [x] Persist one visible construction upgrade through API/PostgreSQL — the bridge repairs one plank
      per quest completion and survives a reload.
- [x] Implement reduced/minimal motion.
- [ ] Validate Android performance.

## Milestone 2: First Brave Step

- [x] Create quest quickly.
- [x] Run resilient sprint — timestamp-authoritative start/pause/resume/complete that survives a reload
      and can't be faked by a client claiming more elapsed time than actually passed.
- [x] Resolve complete, continue, split, or retreat — all four are real. ("Call party", the fifth
      resolution, is blocked on Milestone 5's social system.)
- [x] Grant deterministic, idempotent rewards — one transaction per grant, plus client-supplied
      idempotency keys so a duplicate network retry can't double-apply.
- [x] Restore entire loop after reload.

See [Plan 03](03-first-brave-step.md).

## Milestone 3: Rewarding return

- [x] Daily Campfire and Today's Three. Today's Three and the First Brave Step bonus are real;
      the once-per-day _Campfire welcome beat_ is not — the campfire exists as a landmark with real
      fuel state, but nothing marks a daily return.
- [ ] Weekly Summit and Chronicle. The **Chronicle is built** — an honest weekly account on its own
      `/basecamp/:characterId/chronicle` route. The **Weekly Summit** (the weekly boss, renamed from
      "Expedition" to stop colliding with the Agile/SAFe label for a Sprint) is not.
- [ ] Monthly Campaign chapter.
- [ ] Rest, shield, and Comeback mechanics. (Retreat is already a penalty-free resolution; streak
      shields and a Comeback Quest are not built, and no streak counter exists yet — deliberately, since
      streaks interact with the "no permanent loss after missing a day" rule.)

See [Plan 04](04-rewards-retention.md).

## Milestone 3.5: Character select and onboarding

Milestone 1 prototypes Base Camp's rendering directly (a dev harness can bypass auth to iterate on the
scene quickly); this milestone is when the production auth/character gate goes in front of it, making
character select the actual app entry point rather than a scene prototype shortcut.

- [x] Auth/RBAC: signup, login, JWT + DB-backed refresh sessions.
- [x] Character data model (multiple characters per account) and creation flow.
- [x] Character select as the landing page (not Base Camp), mandatory character creation for new users.
- [x] Polished Three.js character-select screen, stylized sci-fi/cyber direction.

Milestone 3.5 is complete — see [Plan 16](16-character-select.md).

## Milestone 4: Companion intelligence (Ember)

- [ ] Remote, task-driven Ember LLM service via the NestJS API (in-scope, not on-device-first).
- [ ] Editable Hero Profile.
- [ ] Confidence-based autonomy for routine task execution.
- [ ] Per-role coaching specialization.
- [ ] Selectable avatar roster (personality-differentiated, shared engine).
- [ ] Ember's parallel functional + cosmetic leveling track.
- [ ] Verify core quest/sprint loop works with Ember disabled.

See [Plan 05](05-ai-companion.md).

## Milestone 5: Community

- [ ] Allies, parties (real-invited or matchmade), shared quests, guilds, and cooperative events.
- [ ] Personal backlog + shared team backlog.
- [ ] Privacy, moderation, blocking, and reporting.

## Milestone 6: Agile/SAFe depth and complex work

Dual-labeled Agile/SAFe vocabulary and the role/skill-tree system are core product goals, not deferred
"complex work" polish — see [Agile/SAFe progression](../documentation/product/agile-safe-progression.md).

- [ ] Questlines, dependencies, risks, milestones, campaigns.
- [ ] Dual-labeled vocabulary shown by default (not an optional toggle).
- [ ] Role/skill-tree system: Facilitator/Adventurer/Scout/etc., independent levels, full branching
      trees, switchable.
- [ ] Portfolio/community tier: cross-team dependency board + live scheduled ceremony events.
- [ ] Portfolio-tier roles: level-gated and community-elected.

See [Plan 08](08-agile-safe.md).
