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
- [ ] Suggest a small first encounter.
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
- [x] Resolve complete or retreat — two of Plan 03's original five resolutions (complete, continue,
      split, retreat, call party) are real: `POST /quests/:id/complete` and `POST /quests/:id/retreat`
      (`apps/backend/src/quest/quest.service.ts`), both accepting a quest from either `OPEN` or
      `IN_PROGRESS`. Retreat is a deliberate, penalty-free resolution ("rest days and comeback quests
      are legitimate play" — documentation/product/rewards-retention.md's ethical rules), not a failure
      state. "Continue" as a formal quest resolution (ending a session having made partial progress,
      distinct from the sprint pause/resume mechanism above), "split" (partial credit), and "call party"
      (needs the social/guild system, a later milestone) are still open — sprints now exist, but nothing
      yet uses them to drive a quest-level resolution beyond complete/retreat.
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
      (`FOCUS_XP_REWARD` = 15, apps/backend/src/sprint/sprint.service.ts) is now real too, granted on
      sprint completion — both add to the same `Character.xp` counter. The richer Courage/Wisdom XP
      categories from that doc still need resolution variety this project doesn't have yet. Coins are
      spendable on one thing so far — see [Plan 02](02-base-camp-animations.md)'s workbench upgrade.
- [x] Reflect authoritative result in NgRx — `apps/frontend/src/app/state/quests/` (actions, reducer,
      effects) is this project's first real NgRx feature, backed by the actual API, not local component
      state, now including xp/coins/retreat alongside the original quest list and construction stage;
      `apps/frontend/src/app/state/sprints/` follows the same pattern for the sprint timer, with the
      quests reducer cross-syncing xp from sprint completions the same way it already does for coins
      from workbench upgrades. This is also the domain-state foundation the rest of this plan (encounters, "continue"/
      "split"/"call party" resolutions) will extend rather than replace.
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
      gate's timestamp math specifically; NgRx reducer/effects unit tests for both the quests and
      sprints features; and a 3-engine Playwright e2e run that creates four quests, retreats one
      straight from the Backlog column, starts and completes three others via the Kanban board —
      including a full start/pause/resume sprint round trip on one of them, with "Finish sprint"
      asserted disabled the whole time as visible proof of the idle-timer-resistance guarantee — then
      confirms the XP/coins/level display and bridge stage, reloads, and confirms everything persisted).
      Reaching the sprint's success-after-target-duration path isn't practical in an e2e run (the
      shortest preset is 15 real minutes); that path is instead verified live against a real Postgres
      row (backdating `startedAt` directly, not mocking the clock — the same technique used to verify
      the unaffordable/idempotent workbench-upgrade cases). No API integration test tier exists yet in
      this project (`apps/backend-e2e` only has a smoke test) — that's still open.

## What "finished" means here

This plan is not fully done — encounters, the "continue"/"split"/"call party" quest resolutions,
idempotency keys, and celebration moments are all still open, and are real, separate pieces of work,
not rounding errors. What's done is the core value: a quest can be created, visibly started, worked on
in a real timed sprint, resolved two different honest ways, and both the quest and the sprint grant
real, deterministic, transactionally-safe rewards that persist — which is what makes completing a quest
(and sitting through an honest sprint) feel like it matters, rather than just checking a box. The Kanban
board is a first honest step toward the player tracking their own stories/quests the way the app
teaches Agile/SAFe to work, and sprints now give the "In Progress" column something real happening
inside it, not just a status label — but there's still no swimlanes, WIP limits, story points, or a
formal "Continue" resolution tying a quest's sprint history back into its own status. Everything still
open builds on this foundation rather than replacing it.
