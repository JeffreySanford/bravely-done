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
- [ ] Campfire ambient animation.
- [ ] Companion placeholder idle animation.
- [ ] Quest Board, chest, treasury, workbench/tent, bridge, and path.
- [ ] Render a serialized CampSnapshot.

## Animation director

- [ ] Define AnimationPlan contract.
- [ ] Player returned.
- [ ] Quest accepted.
- [ ] Sprint started and calm focus.
- [ ] Quest completed common.
- [ ] XP, coins, loot, and construction.
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
