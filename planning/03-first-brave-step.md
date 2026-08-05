# Plan 03: First Brave Step

- [x] Define a minimal Quest contract (`title`, `status: OPEN | IN_PROGRESS | COMPLETED | RETREATED`,
      `characterId`) — real, not a mock stub. Encounter, Sprint, and CampMutation-beyond-the-bridge
      contracts are still open; this is deliberately just enough to make quest completion, one alternate
      resolution, and a real "in progress" signal durable, not the full loop (no sprints/encounters
      yet).
- [x] Render the quest board as a real Kanban board (Backlog/In Progress/Done/Retreated columns,
      `apps/frontend/src/app/pages/base-camp/base-camp.html`), so a player can see and manage their own
      quests as stories moving across a board — not just tracking, a small first step toward "type this
      back into Agile" for the player's own work, not just the dev team's. `POST /quests/:id/start`
      moves a quest Backlog → In Progress (idempotent, same pattern as complete/retreat); Retreat is
      available from either Backlog or In Progress.
- [x] Create a quest in well under 20 seconds — a title field and one click on Base Camp's quest board
      (`apps/frontend/src/app/pages/base-camp/`), no encounter/sprint step yet.
- [x] Suggest a small first encounter — a real `Encounter` model (`apps/backend/prisma/schema.prisma`)
      under a quest, a small checklist item rather than its own resolution flow: `POST /quests/:questId/
      encounters` (create), `GET .../encounters` (list), `POST /encounters/:id/complete`
      (`apps/backend/src/encounter/`). Deliberately minimal for this first slice — no retreat-equivalent,
      and completing one never gates or auto-triggers quest completion, same "independent of the quest's
      own resolution" relationship Sprints already have. Completing one grants a small flat
      `COURAGE_XP_REWARD` = 5 ("Courage XP for beginning avoided work" — rewards-retention.md), making
      that reward category real too. Rendered as a small checklist on Backlog and In Progress Kanban
      cards only (Done/Retreated cards are already resolved, so the checklist doesn't render there —
      the completed encounter's persistence shows up as the surviving XP total instead).
- [x] Start, pause, resume, and recover a sprint from timestamps — a real `Sprint` model
      (`apps/backend/prisma/schema.prisma`) tied to an in-progress quest, with `POST /quests/:questId/
      sprints` (start), `POST /sprints/:id/pause`, `.../resume`, and `.../complete`
      (`apps/backend/src/sprint/`). Elapsed active time is always recomputed server-side from
      `startedAt`/`pausedAt`/`pausedSeconds` — never trusted from the client — so a reload can recover
      the true timer state (`GET /quests/:questId/sprints`) and completion can't be faked by claiming
      more elapsed time than actually passed. This is what satisfies rewards-retention.md's "reward
      formulas must resist idle timers" rule: `complete` rejects until real elapsed time reaches the
      sprint's target duration, and the Focus XP grant (`FOCUS_XP_REWARD` = 15) is flat regardless of
      how long the sprint runs past that target. A sprint's target is one of four player-chosen presets
      (`SPRINT_DURATION_PRESETS_SECONDS` = 15/25/45/60 min), not an open-ended value, to keep validation
      and abuse surface small for this first slice. Sprint completion is deliberately a separate action
      from quest completion (granting Focus XP, not touching quest status or camp construction) — a
      quest can span more than one sprint, matching the still-open "Continue" resolution.
- [x] Resolve complete, continue, or retreat — three of Plan 03's original five resolutions (complete,
      continue, split, retreat, call party) are real: `POST /quests/:id/complete`, `POST /quests/:id/
      continue`, and `POST /quests/:id/retreat` (`apps/backend/src/quest/quest.service.ts`), all three
      accepting a quest from either `OPEN` or `IN_PROGRESS`. Continue moves an `OPEN` quest to
      `IN_PROGRESS` (same as start) and re-stamps an already-`IN_PROGRESS` one; it's a genuine no-op only
      once the quest has moved on to `COMPLETED`/`RETREATED`. Retreat is a deliberate,
      penalty-free resolution ("rest days and comeback quests are legitimate play" —
      documentation/product/rewards-retention.md's ethical rules), not a failure state. Continue stamps
      `Quest.lastContinuedAt` (re-stamped on every call, not just the first, since a player may continue
      the same quest across many sessions) and leaves the quest `IN_PROGRESS` — no reward, matching
      retreat's reward-free precedent, and no column change on the Kanban board (a "Continue" button
      just sits alongside Retreat/Complete on In Progress cards). It's durable history for a future
      Chronicle/session-summary feature, not surfaced prominently yet. "Split" (partial credit) and
      "call party" (needs the social/guild system, a later milestone) are still open.
- [ ] Submit resolution with idempotency key. (complete/retreat are naturally idempotent by status
      check — re-calling either on an already-resolved quest is a safe no-op — but there's no
      client-supplied idempotency key protecting against duplicate network retries specifically.)
- [x] Persist quest, camp (bridge construction), and reward mutations atomically — `QuestService.
      complete` wraps the quest-status update and the character update (construction stage + xp +
      coins, all three together) in a single `prisma.$transaction`, so a quest can never end up
      "completed" without its reward or vice versa. Materials are represented by
      `campConstructionStage`, not a separate counter (see planning/02's resource loop) — no separate
      inventory/materials system exists.
- [x] Grant deterministic XP and coins on completion (`QUEST_XP_REWARD` = 20, `QUEST_COIN_REWARD` = 10,
      apps/backend/src/quest/quest.service.ts) — matches documentation/product/rewards-retention.md's
      "Quest XP for completion" and "Coins for ordinary progress" reward categories. Focus XP
      (`FOCUS_XP_REWARD` = 15, apps/backend/src/sprint/sprint.service.ts) and Courage XP
      (`COURAGE_XP_REWARD` = 5, apps/backend/src/encounter/encounter.service.ts) are now real too,
      granted on sprint and encounter completion respectively — all three add to the same `Character.xp`
      counter. Only Wisdom XP from that doc still needs resolution variety this project doesn't have
      yet. Coins are spendable on one thing so far — see [Plan 02](02-base-camp-animations.md)'s
      workbench upgrade.
- [x] Reflect authoritative result in NgRx — `apps/frontend/src/app/state/quests/` (actions, reducer,
      effects) is this project's first real NgRx feature, backed by the actual API, not local component
      state, now including xp/coins/retreat alongside the original quest list and construction stage;
      `apps/frontend/src/app/state/sprints/` and `apps/frontend/src/app/state/encounters/` follow the
      same pattern for the sprint timer and encounter checklist, with the quests reducer cross-syncing
      xp from both the same way it already does for coins from workbench upgrades. This is also the
      domain-state foundation the rest of this plan ("continue"/"split"/"call party" resolutions) will
      extend rather than replace.
- [ ] Trigger accessible celebration. A level number now displays (client-side `Math.floor(xp/100)+1`,
      no server-side leveling logic), but there's no animated/accessible celebration moment on reward
      grant — just a text update.
- [x] Restore exact state after reload — verified live: complete and retreat quests, reload the page,
      the quest list, resolution states, bridge construction stage, xp, and coins are all unchanged
      (backed by Postgres via the NgRx effects re-fetching on load, not client-only state). An in-flight
      sprint recovers the same way: `GET /quests/:questId/sprints` on load lets the board reconstruct
      the timer from the sprint's real stored timestamps, not from anything the client remembered.
- [x] Cover the journey through unit and Playwright tests (backend service/controller unit tests
      including the transactional reward grant, start/retreat idempotency, and the sprint completion
      gate's timestamp math specifically; NgRx reducer/effects unit tests for the quests, sprints, and
      encounters features; and a 3-engine Playwright e2e run that creates four quests, adds and completes
      an encounter straight from the Backlog column (Courage XP), retreats one quest, starts and
      completes three others via the Kanban board — including a full start/pause/resume sprint round
      trip on one of them, with "Finish sprint" asserted disabled the whole time as visible proof of the
      idle-timer-resistance guarantee, and a Continue click on another asserted to leave it in the
      In Progress column with no reward before it's completed normally — then confirms the XP/coins/level
      display and bridge stage,
      reloads, and confirms everything persisted). Reaching the sprint's success-after-target-duration
      path isn't practical in an e2e run (the shortest preset is 15 real minutes); that path is instead
      verified live against a real Postgres row (backdating `startedAt` directly, not mocking the
      clock — the same technique used to verify the unaffordable/idempotent workbench-upgrade cases).
      Building the encounter e2e coverage caught a real, unrelated bug: the encounter's plain
      `<form (ngSubmit)>` had no `[formGroup]`/`ngForm` directive attached (the component only imported
      `ReactiveFormsModule`, not `FormsModule`), so `ngSubmit` silently never fired and the browser fell
      back to a native full-page form submission on every encounter add — fixed by importing
      `FormsModule` alongside `ReactiveFormsModule`. No API integration test tier exists yet in this
      project (`apps/backend-e2e` only has a smoke test) — that's still open.

## What "finished" means here

This plan is not fully done — the "split"/"call party" quest resolutions, idempotency keys, and
celebration moments are all still open, and are real, separate pieces of work, not rounding errors.
What's done is the core value: a quest can be created, visibly started, broken into small encounters,
worked on in a real timed sprint, resolved three different honest ways (complete, continue, retreat),
and all three of quest/sprint/encounter grant real, deterministic, transactionally-safe rewards that
persist — which is what makes completing a quest (and sitting through an honest sprint, and taking a
small brave step via an encounter) feel like it matters, rather than just checking a box. The Kanban
board is a first honest step toward the player tracking their own stories/quests the way the app
teaches Agile/SAFe to work, sprints give the "In Progress" column something real happening inside it,
encounters give a quest real internal structure, and Continue lets a session end with real progress
logged without forcing a premature complete/retreat — but there's still no swimlanes, WIP limits, or
story points. Everything still open builds on this foundation rather than replacing it.
