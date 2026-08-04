# Plan 02: Base Camp Animations

**Priority: P0 after foundation stability.**

## Scene foundation

- [x] Create game-rendering and game-animation boundaries (`apps/frontend/src/app/game-rendering/`,
      shared by character-select and Base Camp).
- [x] Create renderer lifecycle independent of Angular component internals (`RendererLifecycle`).
- [x] Mount/destroy without leaks.
- [x] Clamp pixel ratio and resize to container.
- [x] Pause while hidden.
- [ ] Add deterministic seed and animation time scale.
- [x] Support full, reduced, and minimal motion.

## First environment

- [x] Camera and safe UI zones for the real HTML header/back-link (see the interaction rule).
- [x] Ground and simple lighting (`apps/frontend/src/app/pages/base-camp/base-camp-scene.ts`).
- [x] Campfire: animated fire (flame flicker, rising embers, warm flickering point light) with a real
      fuel reserve — each chopped log buys a fixed number of seconds of full flame; once the reserve
      runs out and no more logs are available, the fire settles to embers-only until the player chops
      another tree. Replaces the earlier client-only time-loop entirely.
- [x] Companion placeholder: an idle, bobbing, slowly-rotating landmark near the fire.
- [x] Quest Board, chest, treasury, and bridge landmarks. Workbench still open.
- [x] Per-character tent gated to true first-ever arrival: `Character.hasArrivedAtCamp` (backend,
      `POST /characters/:id/arrive`) is checked before the scene is built, and the erect animation only
      plays when this is the character's first arrival. Returning visits render the tent already
      erected. Verified live via a 3-engine Playwright e2e run (arrive once, reload, confirm no replay
      of the erect animation logic — the backend flag, not client state, is authoritative).
- [x] Choppable trees: clicking a tree (real raycasting against the tree meshes, not a flat button)
      plays an optimistic chop wobble and dispatches a real backend chop (`POST /characters/:id/
      chop-tree`, atomic increment); the resulting firewood count feeds the campfire, see above.
      Verified: backend increment + persistence confirmed live via direct API calls (signup → arrive →
      chop x3 → fresh fetch confirms firewoodCount survives), and the full frontend dispatch chain
      (click → store action → effect → success → AnimationDirector event) has complete unit coverage.
      The literal in-browser click gesture was not observed live this session (the browser pane wasn't
      rendering frames) — flagged here rather than silently claimed.
- [ ] Foraging spots and wandering animals: a static foraging-bush landmark exists; harvesting
      interaction and wandering-animal spawns are not built yet.
- [x] Animated freshwater stream: a rippling vertex-displaced water plane. Not yet a lake shape or a
      harvestable resource — visual anchor only, as scoped in the product doc.
- [ ] Render a serialized CampSnapshot.

## Resource loop

- [x] Chop a tree → firewood pickup (`Character.firewoodCount`, atomic backend increment) → feeds the
      campfire's fuel state for real.
- [ ] Harvest the foraging bush / wandering animals → tracked resource yield. Not started.
- [x] Persist harvested/gathered resources per character — firewood is a real Postgres-backed field,
      verified live via direct API calls (chop, then a fresh unrelated fetch confirms the count).

## Animation director

- [x] Define a minimal `AnimationDirector`/`AnimationSequence` contract
      (`apps/frontend/src/app/game-rendering/animation-director.ts`) — sequences register with a
      director and react to typed domain events via `dispatch()`.
- [x] Player returned (tent sequence — resolved by firstArrival at construction time).
- [x] Tent erection (first arrival for a given character only — gated by backend state, see above).
- [ ] Quest accepted.
- [ ] Sprint started and calm focus.
- [x] Quest completed: `BridgeSequence` reacts to a `questCompleted` event, reveals the next bridge
      plank, and pulses it — driven by the real Quest domain (`POST /quests/:id/complete`, see
      [Plan 03](03-first-brave-step.md)), not a mock stub.
- [ ] XP, coins, loot reveal.
- [x] Resource gathering: `chopTree` (per-tree, reacted to by that tree's own sequence) and
      `firewoodGathered` (campfire reacts by recomputing its fuel reserve) are both wired. Harvest
      plant / catch animal are not — no foraging/animal interaction exists yet.
- [ ] Continue, split, retreat, and comeback.
- [ ] Skip safely to final state.

## Evidence and performance

- [ ] Trigger panel for every sequence.
- [ ] Screenshot baseline states.
- [ ] Mobile viewport and safe-area verification.
- [ ] Screen-reader and keyboard verification.
- [ ] Mid-tier Android frame/thermal test.
- [ ] Graceful 30 FPS fallback.

## Acceptance

- [x] Completing one quest permanently advances one camp construction state in browser, with equivalent
      rewards in all motion modes — verified live: a real Playwright e2e run creates and completes three
      real quests via the quest board (`POST /quests/:id/complete`), confirms the bridge-repair counter
      advances and the "Bridge repaired" state is reached, then reloads the page and confirms the stage
      and quest list persisted (backed by Postgres, not client state). Android verification is not yet
      done — no Capacitor packaging exists yet (see later milestones in `TODO.md`).
