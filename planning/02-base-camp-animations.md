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
- [x] Campfire: animated fire (flame flicker, rising embers, warm flickering point light). Not yet
      done: a fuel state that dims toward embers over time and is replenished by chopped firewood —
      that depends on the resource-gathering loop below.
- [ ] Companion placeholder idle animation.
- [ ] Quest Board, chest, treasury, workbench, bridge, and path.
- [x] MVP tent: a tent mesh scales up ("erects") once per page load when a character arrives at
      `/basecamp/:characterId`. Not yet done: gating this to a character's true *first-ever* arrival
      (currently persisted nowhere, so it replays on every visit) and one tent per character
      simultaneously visible — both need the durable camp/character state this plan's later milestones
      bring in, not just the rendering piece.
- [ ] Choppable trees: chop animation, tree falls, produces firewood/log pickups, leaves a stump.
- [ ] Foraging spots and wandering animals: harvestable plants/bushes and randomly-spawning animals
      that can be gathered for survival resources (see the product doc's resource loop).
- [ ] Animated freshwater stream or lake (flowing/rippling water shader, not a static plane) as the
      camp's water source and visual anchor.
- [ ] Render a serialized CampSnapshot.

## Animation director

- [ ] Define AnimationPlan contract.
- [ ] Player returned.
- [ ] Tent erection (first arrival for a given character only).
- [ ] Quest accepted.
- [ ] Sprint started and calm focus.
- [ ] Quest completed common.
- [ ] XP, coins, loot, and construction.
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

- [ ] Completing one mock quest permanently advances one camp construction state in browser and Android, with equivalent rewards in all motion modes.
