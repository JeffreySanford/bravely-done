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

- [x] Add NgRx Store and Effects using feature boundaries — two real slices now:
      `apps/frontend/src/app/state/quests/` and `apps/frontend/src/app/state/camp/` (firewood/resource
      state), each with its own actions, reducer, and effects backed by real APIs, not local component
      signals. Other domains (encounters, sprints) aren't in the store yet — this establishes the
      pattern, not full coverage.
- [x] Define durable domain state separately from render state — quests, construction-stage, and
      firewood now live in the NgRx store (durable), while scene rendering state (camera, mesh
      references) stays local to `base-camp-scene.ts`, never mixed into the store.
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
      light, now fueled by real chopped firewood), and a tent that erects on arrival. Reachable at
      `/basecamp/:characterId` — clicking a character on character select, or finishing character
      creation, lands the character's avatar in Base Camp. Verified via a 3-engine Playwright e2e
      journey covering both entry paths.
- [x] Add companion placeholder, quest board, chest, treasury, bridge, and workbench landmarks — the
      workbench is now clickable too, spending coins on a real capped level (see below).
- [x] Add ambient animation and full/reduced/minimal motion modes (reuses the character-select scene's
      motion-mode plumbing).
- [x] Add a minimal animation director (`AnimationDirector`/`AnimationSequence`) driven by domain
      events — arrival, quest-completion, tree-chopping, and foraging are wired; more events (quest
      accepted, sprint states, loot) are still open.
- [x] Gate the tent-erect animation to a character's true first-ever arrival: backend
      `Character.hasArrivedAtCamp` (`POST /characters/:id/arrive`) is the source of truth, not client
      state — verified live (arrive, reload, confirm no replay).
- [x] Add chopping and foraging interaction with real resource tracking for the tree and bush
      landmarks: clicking either (real raycasting) dispatches an atomic Postgres increment
      (`POST /characters/:id/chop-tree` or `.../forage`) through this project's second NgRx feature
      (`apps/frontend/src/app/state/camp/`); the resulting firewood count drives the campfire's fuel
      reserve for real. Verified live end to end — both the backend contract (direct API calls) and
      the actual in-browser click, using the character's real projected screen position computed from
      the live camera matrices, not a guessed coordinate.
- [x] Give forage a real sink: the companion's glow and idle-bob liveliness now scale with total
      forage gathered ("upkeep" — matches documentation/product/base-camp.md's resource loop).
      Verified live with a real before/after screenshot comparison (forage 1 → 9 visibly brightens the
      companion). Wandering-animal interaction is still open.
- [x] Complete a quest and visibly upgrade the camp: a real Quest domain (create/list/complete,
      `apps/backend/src/quest/`) replaces the earlier mock-quest stub. `POST /quests/:id/complete`
      advances `Character.campConstructionStage`, and the bridge visibly repairs one plank per
      completion up to fully repaired.
- [x] Persist and restore the upgrade through the API/PostgreSQL — verified live (create and complete
      quests, reload the page, confirm the quest list and repaired stage both survive).
- [x] Polish scene lighting/atmosphere (2026-08-04): a hemisphere + directional fill light, fog, and a
      warm ground-glow decal under the campfire replace the original flat ambient light — the ground
      and every non-emissive landmark (trees, tent, chest, treasury) now actually read as lit shapes
      instead of near-black silhouettes. No new mechanics — a deliberate polish-only pass.
- [ ] Establish Android performance budgets before adding complex assets.

## Next: First Brave Step

- [x] Create a quest in under 20 seconds — a real quest (title + status), not an encounter/sprint yet.
      See [Plan 03](planning/03-first-brave-step.md) for exactly what this first slice does and doesn't
      cover.
- [x] Run a resilient Adventure Sprint — a real `Sprint` tied to an in-progress quest
      (`apps/backend/src/sprint/`), with start/pause/resume/complete all timestamp-authoritative:
      elapsed active time is always recomputed server-side from `startedAt`/`pausedAt`/`pausedSeconds`,
      never trusted from the client, so a reload recovers the true timer and completion can't be faked.
      `complete` rejects until real elapsed time reaches the chosen target (one of four presets — 15/25/
      45/60 min), which is what makes the flat Focus XP reward (`FOCUS_XP_REWARD` = 15) resistant to
      idle timers. Verified live via direct API calls (including backdating a real Postgres row to prove
      the success path, not just the rejection path) and a 3-engine Playwright e2e run covering the
      full start/pause/resume flow with "Finish sprint" asserted disabled throughout.
- [x] Resolve complete, continue, retreat, or split — four of five resolutions are real (`POST /quests/
      :id/complete`, `POST /quests/:id/continue`, `POST /quests/:id/retreat`, `POST /quests/:id/split`),
      all accepting a quest from `OPEN` or `IN_PROGRESS`; "call party" (needs the social system) is still
      open. Continue stamps `Quest.lastContinuedAt` (re-stamped on every call, not just the first) and
      leaves the quest `IN_PROGRESS` with no reward — same reward-free precedent as retreat, durable
      history for a future session-summary feature rather than something surfaced prominently today. A
      "Continue" button sits alongside Retreat/Split/Complete on In Progress Kanban cards only. Split
      grants half `QUEST_XP_REWARD`/`QUEST_COIN_REWARD` (rounded down) and moves the quest to a real
      Split Kanban column — partial credit for real progress that won't finish as scoped, distinct from
      full-credit Complete and no-credit Retreat. Verified live via direct API calls (Continue:
      moves OPEN→IN_PROGRESS+stamps, re-stamps on repeat calls, no-op once COMPLETED/RETREATED/SPLIT;
      Split: half reward granted, idempotent on repeat) and a 3-engine Playwright e2e run asserting a
      Continue click leaves a quest in the In Progress column before it's completed normally, and a
      Split click moves another to the Split column with the correct half reward and an accessible
      celebration toast.
- [x] Grant deterministic XP and coins (`QUEST_XP_REWARD` = 20, `QUEST_COIN_REWARD` = 10 per
      completion, `SPLIT_XP_REWARD`/`SPLIT_COIN_REWARD` = half that, rounded down, per split) — a level
      number now displays in Base Camp (`Level {n} — {xp} XP — {coins} coins`). "Materials" are
      represented by the existing bridge construction stage, not a separate counter.
- [x] Make reward application transactional — the quest-status update and the xp/coins/construction-
      stage grant happen in one `prisma.$transaction`, so a quest can't end up completed (or split)
      without its reward. `complete`/`continue`/`retreat`/`split` all accept an optional client-generated
      `idempotencyKey` (a fresh UUID per click); `Quest.lastIdempotencyKey` stores the last one
      processed, and a duplicate network retry carrying the same key is returned as-is without
      re-executing the mutation — matters most for `continue()`, which deliberately isn't idempotent by
      status alone. Verified live: same key twice leaves state unchanged, a fresh key re-applies
      normally.
- [x] Verify quest creation, completion, retreat, split, and reward persistence through unit,
      integration, and Playwright tests (backend + NgRx unit tests including the idempotency-key
      dedupe and the celebration `lastReward` delta; a real API integration tier in `apps/backend-e2e`
      hitting the actual running backend + Postgres, not mocked Prisma; a 3-engine e2e run that retreats
      one quest, splits another, completes three, and confirms XP/coins/level survive a reload).
- [x] Give coins a real sink: workbench upgrades (`POST /characters/:id/upgrade-workbench`, capped at
      `WORKBENCH_MAX_LEVEL`, costs in `WORKBENCH_UPGRADE_COSTS`) — see [Plan 02](planning/
      02-base-camp-animations.md) for the scene wiring. Verified live: affordable/unaffordable/
      already-maxed all behave correctly via direct API calls, and a Playwright e2e run earns coins from
      quests, upgrades once, and confirms the level and remaining coins survive a reload.
- [x] Give the workbench a real capability unlock: `gatheringYield(workbenchLevel)`
      (`apps/backend/src/character/character.service.ts`) scales chop/forage yield from 1 unit at level
      0 up to 4 at `WORKBENCH_MAX_LEVEL`, closing the coins → workbench → resources loop instead of
      leaving `workbenchLevel` as a displayed number with no gameplay effect. Doesn't touch the
      idle-timer-resistance rule (rewards-retention.md) since it only speeds up explicit, real
      one-click-per-grant actions, not a passive/timer-based reward. Verified live at levels 0/1/3
      confirming the exact yield at each.
- [x] Let players track their own quests as a real in-game Kanban board (Backlog/In Progress/Done/
      Retreated), not just a flat list — a first honest step toward "typing this project's own Agile
      process back into the game" for the player, not just the dev team. Added a real
      `QuestStatus.IN_PROGRESS` and `POST /quests/:id/start` (idempotent, same pattern as complete/
      retreat) so "in progress" is a real backend state, not a display grouping. Verified live via
      direct API calls (start, re-start is a no-op, complete from in-progress, start-a-completed-quest
      is a no-op) and a 3-engine Playwright e2e run covering the full board flow. No drag-and-drop,
      WIP limits, or sprint/story-point association yet — that's future scope, not this slice.
- [x] Turned the board into an on-demand overlay instead of an always-docked panel, after direct
      feedback that it was taking over the whole screen — a "Quests" toggle button in `.stage__footer`
      opens it centered over a dimming backdrop; clicking the backdrop or a Close button dismisses it.
      No new domain logic, just a `boardOpen` signal — verified via a Playwright e2e round trip
      (open → close → reopen → confirms persisted state survives a reload with the board starting
      closed again each time).
- [x] Suggest a small first encounter — a real `Encounter` checklist item under a quest
      (`apps/backend/src/encounter/`, `POST /quests/:questId/encounters`, `.../complete`), independent
      of the quest's own resolution (no gating, no retreat-equivalent) and granting a flat
      `COURAGE_XP_REWARD` = 5 on completion, making the "Courage XP for beginning avoided work" reward
      category real. Rendered as a small checklist on Backlog/In Progress Kanban cards. Verified live
      (create/list/complete, idempotent re-complete, quest status genuinely untouched) and via a
      3-engine Playwright e2e run — which caught a real bug along the way: the encounter form's
      `(ngSubmit)` never fired because the component only imported `ReactiveFormsModule`, not
      `FormsModule`, so the browser fell back to a native full-page form submission; fixed by importing
      `FormsModule` too.
- [x] Trigger an accessible celebration on every reward grant (quest complete/split, sprint Focus XP,
      encounter Courage XP) — a `role="status"`/`aria-live="polite"` toast (`.celebration-toast`) showing
      the actual XP/coins gained, computed once as a delta in the NgRx reducer (`QuestsState.lastReward`)
      so a page load or a workbench-upgrade coin spend never falsely triggers one. Respects
      `prefers-reduced-motion` (same ~2.4s duration, no movement in the reduced variant).

- [x] Build the Daily half of the reward loop (rewards-retention.md's Daily cadence — see
      [Plan 04](planning/04-rewards-retention.md)): a **First Brave Step** bonus (10 XP / 5 coins)
      granted on the first quest a character *completes* each UTC day (`Character.firstBraveStepDay`),
      and **Today's Three** — up to 3 player-designated quests per UTC day (`POST`/`DELETE
      /quests/:id/todays-three`, `Quest.todaysThreeDay`), each granting 10 XP / 5 coins on top of the
      normal reward when completed. Both stack, both ride the existing transactional reward path, and
      neither is grantable by `split()` or by idling — they fire only on a real completion, keeping
      the idle-timer-resistance rule intact. A star toggle on Backlog/In Progress Kanban cards drives
      the designation; the celebration toast names which bonus fired. Verified live via direct API
      calls (3-per-day cap, idempotent re-designation, undesignate frees a slot, bonus stacking, split
      grants neither), a real-Postgres integration suite, and a 3-engine Playwright e2e run.

## Later milestones

- [ ] Weekly and monthly reward loops (Expedition/Chronicle, Campaign chapter) — the Daily cadence is
      done; these two are each substantially larger and need their own scoping pass.
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
