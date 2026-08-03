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
- [ ] Finish developer scripts and CI.
- [ ] Add authentication and health foundations.
- [ ] Establish clean lint, test, build, e2e, and migration baseline.

## Milestone 1: Base Camp Alive

- [ ] Render responsive Three.js camp in browser phone harness.
- [ ] Add ambient scene and companion placeholder.
- [ ] Implement quest-accepted, sprint, and completion choreography.
- [ ] Persist one visible construction upgrade through API/PostgreSQL.
- [ ] Implement reduced/minimal motion.
- [ ] Validate Android performance.

## Milestone 2: First Brave Step

- [ ] Create quest quickly.
- [ ] Run resilient sprint.
- [ ] Resolve complete, continue, split, or retreat.
- [ ] Grant deterministic, idempotent rewards.
- [ ] Restore entire loop after reload.

## Milestone 3: Rewarding return

- [ ] Daily Campfire and Today's Three.
- [ ] Weekly Expedition and Chronicle.
- [ ] Monthly Campaign chapter.
- [ ] Rest, shield, and Comeback mechanics.

## Milestone 3.5: Character select and onboarding

Milestone 1 prototypes Base Camp's rendering directly (a dev harness can bypass auth to iterate on the
scene quickly); this milestone is when the production auth/character gate goes in front of it, making
character select the actual app entry point rather than a scene prototype shortcut.

- [ ] Auth/RBAC: signup, login, JWT + DB-backed refresh sessions.
- [ ] Character data model (multiple characters per account) and creation flow.
- [ ] Character select as the landing page (not Base Camp), mandatory character creation for new users.
- [ ] Polished Three.js character-select screen, stylized sci-fi/cyber direction.

See [Plan 16](16-character-select.md).

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
