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
- [x] Campfire: animated fire (flame flicker, rising embers, warm flickering point light) with a
      client-side fuel state that ramps down toward embers-only over time and loops. Not yet backed by
      a real firewood system — see "Resource loop" below.
- [x] Companion placeholder: an idle, bobbing, slowly-rotating landmark near the fire.
- [x] Quest Board, chest, treasury, and bridge landmarks. Workbench still open.
- [x] Per-character tent gated to true first-ever arrival: `Character.hasArrivedAtCamp` (backend,
      `POST /characters/:id/arrive`) is checked before the scene is built, and the erect animation only
      plays when this is the character's first arrival. Returning visits render the tent already
      erected. Verified live via a 3-engine Playwright e2e run (arrive once, reload, confirm no replay
      of the erect animation logic — the backend flag, not client state, is authoritative).
- [ ] Choppable trees: visual tree landmarks exist; chopping interaction and firewood pickups are not
      built yet (see "Resource loop").
- [ ] Foraging spots and wandering animals: a static foraging-bush landmark exists; harvesting
      interaction and wandering-animal spawns are not built yet.
- [x] Animated freshwater stream: a rippling vertex-displaced water plane. Not yet a lake shape or a
      harvestable resource — visual anchor only, as scoped in the product doc.
- [ ] Render a serialized CampSnapshot.

## Resource loop (visual landmarks only, this pass)

Trees, the foraging bush, and the stream currently exist as static/ambient scene landmarks with no
interaction or backend resource tracking — that's the next slice of this plan, not yet started:

- [ ] Chop a tree → firewood pickup → feeds the campfire's fuel state for real (replacing the current
      client-only decay loop).
- [ ] Harvest the foraging bush / wandering animals → tracked resource yield.
- [ ] Persist harvested/gathered resources per character.

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
- [ ] Resource gathering: chop tree, harvest plant, catch animal.
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
