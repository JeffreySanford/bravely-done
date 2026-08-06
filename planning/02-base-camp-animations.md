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
      `WORKBENCH_MAX_LEVEL`/`WORKBENCH_UPGRADE_COSTS` in
      `apps/backend/src/character/character.service.ts`) — its glow rings light up one at a time as
      `workbenchLevel` rises. The workbench now
      has a real capability unlock too: `gatheringYield(workbenchLevel)` (same file) scales how much
      firewood/forage one chop/forage click grants — 1 unit at level 0 up to 4 at
      `WORKBENCH_MAX_LEVEL`, a better tool crafted at the workbench rather than just a bigger displayed
      number. Verified live via direct API calls at levels 0/1/3 confirming the exact yield at each
      level.
- [x] Per-character tent gated to true first-ever arrival: `Character.hasArrivedAtCamp` (backend,
      `POST /characters/:id/arrive`) is checked before the scene is built, and the erect animation only
      plays when this is the character's first arrival. Returning visits render the tent already
      erected. Verified live via a 3-engine Playwright e2e run (arrive once, reload, confirm no replay
      of the erect animation logic — the backend flag, not client state, is authoritative).
- [x] Choppable trees: clicking a tree (real raycasting against the tree meshes, not a flat button)
      plays an optimistic chop wobble and dispatches a real backend chop
      (`POST /characters/:id/chop-tree`, atomic increment); the resulting firewood count feeds the
      campfire, see above.
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
- [x] Sprint started and calm focus: `FocusSequence`
      (`apps/frontend/src/app/pages/base-camp/base-camp-scene.ts`) reacts to a `sprintFocusChanged`
      event with a calm, slow-tumbling halo around
      the companion — fading gently in while any Adventure Sprint is `ACTIVE` and fading back out
      otherwise (`FOCUS_FADE_SECONDS` = 0.6s), deliberately distinct from the celebratory pulses used
      for quest/workbench rewards elsewhere in this file, since a sprint is sustained focus, not a
      momentary reward. `base-camp.ts` computes `anySprintActive` from the sprints NgRx state and
      dispatches the event via a signal `effect()` whenever it changes, so pausing/resuming/completing
      any in-progress quest's sprint all correctly fade the halo — not just start/stop. Verified via a
      dedicated unit test asserting the director receives the event on both the on and off transitions,
      and the full Playwright e2e suite (which genuinely renders WebGL and exercises a real sprint
      start/pause) ran clean with no runtime errors. Live visual confirmation in a real browser wasn't
      possible this pass — this session's Browser pane tooling wasn't compositing frames — so this
      relies on that compensating evidence rather than a screenshot; a manual look is still open.
- [x] Quest completed: `BridgeSequence` reacts to a `questCompleted` event, reveals the next bridge
      plank, and pulses it — driven by the real Quest domain (`POST /quests/:id/complete`, see
      [Plan 03](03-first-brave-step.md)), not a mock stub.
- [ ] XP, coins, loot reveal. Every reward grant now raises an accessible HTML celebration toast
      (`.celebration-toast`, `role="status"`/`aria-live="polite"`, naming any Daily bonus that fired —
      see [Plan 03](03-first-brave-step.md)), but there is still no _scene-side_ reveal: nothing in the
      3D camp reacts to XP or coins specifically, and loot doesn't exist as a concept yet.
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

## UI polish pass (2026-08-05)

A fourth real bug, this time caught by reading the stylesheet rather than a screenshot (the Browser
pane in this pass's environment wasn't compositing frames, so live visual confirmation wasn't
available — the CSS reasoning below is verifiable directly from source, but a manual look is still
open): **every Kanban-card action button, the board's Close button, and the "Add quest" submit
button were rendering full-width, one per line**, instead of sitting compactly side by side. The
global `.bd-button` sets `width: 100%` (correct for the full-width buttons it was designed for, e.g.
signup/login), and none of the button-row selectors in `base-camp.scss` overrode it — real `<button>`
elements are `inline-block` by default, so `width: 100%` genuinely applies and forces wrapping in a
`flex-wrap: wrap` row. Fixed by adding `width: auto` to every action-row button selector
(`.kanban-card__actions .bd-button`, `.sprint-picker__options .bd-button`, `.kanban-board__close`,
`.kanban-board__form .bd-button`, `.board-toggle`).

A second bug in the same pass: the quest-title input reused the global `.bd-field` class directly on
itself, but `.bd-field` (`apps/frontend/src/styles.scss`) is a label+input+hint _wrapper_ — every
other form in the app (signup, login, character creation) wraps a `<label>`/`<input>`/hint `<span>`
in a `.bd-field` div, and the actual input styling lives in a `.bd-field input` descendant selector.
Applying `.bd-field` straight to the `<input>` meant that descendant selector never matched, so the
quest-title input silently fell back to unstyled browser defaults instead of the app's real input
look. Fixed by giving it its own `.kanban-board__form-input` class with the same visual treatment,
since this is a single unlabeled input (`aria-label` instead of a visible `<label>`) in a compact
inline row, not a fit for the wrapper pattern.

Also added: a fade/scale-in entrance for the board overlay and its backdrop (previously popped in
with no transition), a hover state on Kanban cards, and a thin cyan-to-violet accent line along the
top of the board and workbench panels, echoing `.bd-button`'s gradient so both read as part of the
same visual system. Verified via the full test/typecheck/lint/build suite and the 3-engine Playwright
e2e run (all green, no regressions) — not via a live screenshot, which is the one honest gap in this
pass's verification.

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
