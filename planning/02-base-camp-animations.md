# Plan 02: Base Camp Animations

**Priority: P0 after foundation stability.**

## Scene foundation

- [ ] Create game-rendering and game-animation boundaries.
- [ ] Create renderer lifecycle independent of Angular component internals.
- [ ] Mount/destroy without leaks.
- [ ] Clamp pixel ratio and resize to container.
- [ ] Pause while hidden.
- [ ] Add deterministic seed and animation time scale.
- [ ] Support full, reduced, and minimal motion.

## First environment

- [ ] Portrait camera and safe UI zones.
- [ ] Ground, background, and simple lighting.
- [ ] Campfire: real animated fire (flame, embers, smoke, warm point light), with a fuel state that
      dims toward embers over time and is replenished by chopped firewood.
- [ ] Companion placeholder idle animation.
- [ ] Quest Board, chest, treasury, workbench, bridge, and path.
- [ ] Per-character tents: not present until that character's first arrival, then erected via a short
      animated sequence (canvas unfurl, stakes driven in) and persisted as a permanent camp landmark.
      One tent per character on the account, not per account.
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
