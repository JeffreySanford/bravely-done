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
- [x] Ground and lighting (`apps/frontend/src/app/pages/base-camp/base-camp-scene.ts`) — a hemisphere
      light (cool "sky" fading to a warm "ground" bounce) plus a directional fill light, fog for depth,
      and a canvas-texture warm glow decal under the campfire. The original flat single ambient light
      left the ground and every non-emissive landmark reading as near-black silhouettes; this pass
      (2026-08-04) was a deliberate polish-only pass with no new mechanics, prompted by that feedback.
- [x] Campfire: animated fire (flame flicker, rising embers, warm flickering point light) with a real
      fuel reserve — each chopped log buys a fixed number of seconds of full flame; once the reserve
      runs out and no more logs are available, the fire settles to embers-only until the player chops
      another tree. Every arrival also gets `INITIAL_FREE_FUEL_SECONDS` of free burn regardless of
      firewoodCount, so a brand-new character (0 firewood) still finds a lit fire — see "Visual
      verification" below for the bug this fixes.
- [x] Companion placeholder: an idle, bobbing, slowly-rotating landmark near the fire, whose glow and
      liveliness now scale with forage gathered ("upkeep" — see "Resource loop" below).
- [x] Quest Board, chest, treasury, bridge, and workbench landmarks. The workbench is clickable (real
      raycasting) and spends real coins on a capped upgrade (`POST /characters/:id/upgrade-workbench`,
      `WORKBENCH_MAX_LEVEL`/`WORKBENCH_UPGRADE_COSTS` in `apps/backend/src/character/character.
      service.ts`) — its glow rings light up one at a time as `workbenchLevel` rises. Deliberately just a
      level number for now: no actual capability unlock (faster chopping, bigger inventory, etc.) is
      wired to it yet, same honest gap as construction stage advancing the bridge without unlocking new
      mechanics.
- [x] Per-character tent gated to true first-ever arrival: `Character.hasArrivedAtCamp` (backend,
      `POST /characters/:id/arrive`) is checked before the scene is built, and the erect animation only
      plays when this is the character's first arrival. Returning visits render the tent already
      erected. Verified live via a 3-engine Playwright e2e run (arrive once, reload, confirm no replay
      of the erect animation logic — the backend flag, not client state, is authoritative).
- [x] Choppable trees: clicking a tree (real raycasting against the tree meshes, not a flat button)
      plays an optimistic chop wobble and dispatches a real backend chop (`POST /characters/:id/
      chop-tree`, atomic increment); the resulting firewood count feeds the campfire, see above.
      Verified: backend increment + persistence confirmed live via direct API calls (signup → arrive →
      chop x3 → fresh fetch confirms firewoodCount survives). The in-browser click itself is now
      verified live too (see "Visual verification" below) — clicking a tree's real projected screen
      position increments the firewood count end to end.
- [x] Foraging spots: clicking the bush (real raycasting) plays an optimistic squash-and-grow pulse
      and dispatches a real backend harvest (`POST /characters/:id/forage`, atomic increment).
      Verified live the same way as chopping — real click at the bush's projected screen position
      increments the forage count end to end. Wandering-animal spawns are not built yet.
- [x] Animated freshwater stream: a rippling vertex-displaced water plane. Not yet a lake shape or a
      harvestable resource — visual anchor only, as scoped in the product doc.
- [ ] Render a serialized CampSnapshot.

## Resource loop

- [x] Chop a tree → firewood pickup (`Character.firewoodCount`, atomic backend increment) → feeds the
      campfire's fuel state for real.
- [x] Harvest the foraging bush → forage pickup (`Character.forageCount`, atomic backend increment) →
      feeds companion upkeep for real: the companion's glow intensity and idle-bob liveliness scale
      with total forage gathered (capped at `COMPANION_UPKEEP_CAP`), matching the resource loop
      documented in documentation/product/base-camp.md ("foraged plants... feed future systems
      (companion upkeep...)"). Verified live: forage from 1 → 9 visibly brightens the companion in a
      real screenshot comparison, the same technique used for the campfire fix. Wandering animals are
      not built.
- [x] Persist harvested/gathered resources per character — firewood and forage are both real
      Postgres-backed fields, verified live via direct API calls (harvest, then a fresh unrelated
      fetch confirms the count).
- [x] Give coins a real sink: the workbench upgrade (see above) is the first way coins can be spent,
      not just earned from quests. Unlike chop/forage, an upgrade can be rejected (insufficient coins),
      so the click handler does not play an optimistic success animation — `WorkbenchSequence` only
      pulses once the backend actually confirms the upgrade via the `workbenchUpgraded` event, and the
      backend's real "Not enough coins for the next workbench upgrade" error surfaces in the UI (not a
      generic fallback). `coins` itself lives in the quests NgRx feature (it's quest-reward currency)
      but the camp feature's `upgradeWorkbenchSuccess` action is cross-reducer-synced into it, since
      spending happens via camp/workbench. Verified live via direct API calls: an unaffordable upgrade
      is rejected with the coins/level unchanged, an affordable one deducts coins and increments the
      level atomically, and repeating the request past `WORKBENCH_MAX_LEVEL` is a safe no-op (same
      idempotent-resolution pattern as quest complete/retreat) — plus a full Playwright e2e run
      (earn 30 coins from quests, upgrade once for 10, confirm the level/coins both persist on reload).

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
- [x] Resource gathering: `chopTree` (per-tree, reacted to by that tree's own sequence),
      `firewoodGathered` (campfire reacts by recomputing its fuel reserve), `forage` (the bush's own
      sequence plays a harvest pulse), and `forageGathered` (the companion reacts by updating its
      upkeep-driven glow) are all wired. Catch animal is not — no animal interaction exists yet.
- [x] Workbench upgraded: `WorkbenchSequence` reacts to a `workbenchUpgraded` event (dispatched only
      after the backend confirms — see "Resource loop" above) by stepping up its glow rings and playing
      a brief celebratory pulse.
- [ ] Continue, split, retreat, and comeback.
- [ ] Skip safely to final state.

## Visual verification (2026-08-04)

Unit tests and Playwright's bounding-box checks had never actually verified pixel content, only
that the canvas element existed with a nonzero size — so two real bugs shipped unnoticed until an
actual screenshot was taken:

- **The campfire was invisible on arrival.** The real-firewood fuel system (see above) made a brand-
  new character's fire start fully unlit (0 firewood → 0 fuel), when the intended design was "the fire
  is always going — that's what makes it feel like a lived-in camp" (see documentation/product/
  base-camp.md). Fixed by giving every arrival a free base burn independent of firewoodCount.
- **The quest-board panel was rendered directly on top of the campfire.** `.stage__footer` used
  `margin-top: auto` inside a centered flex column, which put it at roughly the same screen position
  as the world-origin campfire from this camera angle — so the one landmark meant to be the emotional
  center of the scene was hidden behind an HTML dialog. Fixed by docking the quest board to a
  bottom-right corner (`position: absolute`) instead of centering it in the flex flow.

Both were caught and fixed by taking an actual screenshot (`mcp__playwright__browser_take_screenshot`)
and reading back live WebGL pixel values, not by any automated test. **This is now a known gap in this
project's testing strategy**: OPEN-004's e2e compensating evidence only proves the canvas mounts, not
that anything meaningful is drawn or isn't obscured by other UI. No automated regression test exists
for either bug yet — closing that gap (e.g., a visual-regression or pixel-sampling check in CI) is
still open.

The same live-click verification technique (compute a landmark's real screen position from the live
`camera.matrixWorldInverse`/`projectionMatrix`, dispatch a synthetic click there, read the result back
from the DOM) was reused to verify the foraging bush, and along the way caught a third, unrelated
issue: **a long-running local dev backend process silently kept serving a stale build** after several
schema/DTO changes (`forageCount` missing from the API response entirely, not just wrong — an old
compiled bundle from before the field existed). Not a code bug, but a reminder that this project's
`nx serve` dev server does not hot-reload backend schema/DTO changes — it must be restarted (ideally
with `--skip-nx-cache`) after backend model changes, same as CI always does with a fresh process.

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
