# Base Camp Experience

Base Camp is the emotional home and primary game surface. It shows the consequences of completed work without forcing the player to inspect dashboards.

Base Camp is what the player lands in **after** choosing a character — see
[Character select](character-select.md) for the actual landing page and onboarding sequence. Base Camp
is not itself the app's first screen.

## Initial landmarks

- Campfire: continuity, rest, and return — a real fire (flickering flame geometry/shader, embers,
  smoke, warm point-light bloom onto nearby ground and tents), not a static prop.
- Companion: coaching and emotional feedback
- Quest Board: capture and selection
- Chest: loot reveal
- Treasury: coins and paid bounty progress
- Workbench or tent: capability upgrades
- Damaged bridge and path: first long-term construction progression
- Tents, one per character on the account: a tent is not present from the start — it is **erected**
  the first time that character arrives at Base Camp (from character select, or returning from a
  quest/expedition), as a short animated sequence (canvas/roll unfurling, stakes driven in). Once
  erected, a character's tent is a permanent camp landmark, distinguishing "a camp with people living
  in it" from an empty stage set.
- Harvestable resource nodes: trees that can be chopped for firewood (chopping animation, tree falls,
  log/firewood pickup, stump remains — feeds the campfire's fuel state), and foraging spots
  (small plants/bushes, and randomly-spawning wandering animals) that can be harvested/gathered for
  survival resources. These are the camp's first resource-gathering loop, distinct from the Quest
  Board's task-completion loop — see [Plan 02](../../planning/02-base-camp-animations.md) for the
  build sequencing.
- Freshwater stream or lake: animated water (flowing/rippling shader, not a static plane), the camp's
  water source — visually and narratively ties the "survive" resource loop together with the
  "build/complete quests" loop.

## Resource and survival loop

Base Camp is not only a reflection of completed work (quests → construction) — it is also a place the
character's camp visibly *sustains itself* moment to moment:

- Firewood (from chopped trees) fuels the campfire; an unfed fire visibly dims/goes to embers over
  time, and is relit by returning with more firewood — this is deliberately a light ambient-state
  loop, not a punishing survival-game timer.
- Foraged plants and harvested animals represent food/supply resources tracked per-account, feeding
  future systems (companion upkeep, expedition provisioning) without blocking the core Agile/SAFe
  teaching loop — resource gathering is flavor and texture on top of the quest system, never a gate
  in front of it.
- The stream/lake is the resource loop's visual anchor and does not currently have a harvestable
  yield of its own (no fishing at this stage) — it establishes the camp's sense of place and is a
  natural home for future systems (fishing, camp expansion toward the water) without committing to
  them yet.

## Scene states

- Cold return
- Warm return
- Quest accepted
- Sprint focus
- Common completion
- Significant completion
- Split or retreat
- Comeback
- Weekly expedition
- Tent erection: plays once per character, the first time that character reaches Base Camp (see
  Initial landmarks above); every later arrival is a Cold/Warm return against an already-erected tent.
- Resource gathering: chopping a tree, harvesting a plant, or catching a wandering animal — short,
  interruptible ambient actions layered on top of whatever scene state is otherwise active.

## Interaction rule

Important actions remain accessible through ordinary semantic HTML. The Three.js scene adds delight and spatial meaning but is never the only way to operate the application.

## First construction arc

The first several completed quests repair a bridge. Each completion produces a visible stage so the player immediately understands that real work changes the world.

## Implementation status

A first real pass of Base Camp exists at `/basecamp/:characterId`
(`apps/frontend/src/app/pages/base-camp/`), reached from character creation (first arrival) and from
character select (return visits):

- **Built**: ground and lighting, an animated campfire with a real fuel reserve (each chopped log buys
  a fixed number of seconds of flame; every arrival also gets a free base burn so the fire is never
  unlit just because a character hasn't chopped anything yet; the fire settles to embers-only once
  the reserve runs out), a companion placeholder, clickable trees and a clickable foraging bush (real
  raycasting; both backed by atomic Postgres increments — `POST /characters/:id/chop-tree` and
  `POST /characters/:id/forage`), a stream landmark (still visual only), and the quest board/chest/
  treasury/bridge landmarks. The tent-erect animation is correctly gated to a character's true
  first-ever arrival via a backend flag (`Character.hasArrivedAtCamp`), not just client state. A real
  quest board lets a player create and complete quests (`apps/backend/src/quest/`); completing one
  advances real backend progress (`Character.campConstructionStage`) and the bridge visibly repairs,
  persisting across reloads. Quest, construction-stage, and camp-resource (firewood/forage) state all
  live in this project's NgRx store (`apps/frontend/src/app/state/quests/`,
  `apps/frontend/src/app/state/camp/`), not local component state.
- **Not yet built**: wandering-animal interaction, spending forage on anything (it's tracked but not
  consumed by any system yet), the workbench, encounters/sprints/rewards on top of quests (see
  [Plan 03](../../planning/03-first-brave-step.md)), and the animation director's fuller event set
  (quest accepted, sprint states, loot reveal, etc. — arrival, quest-completion, tree-chopping, and
  foraging are wired so far). See [Plan 02](../../planning/02-base-camp-animations.md) for the
  itemized build sequencing.
