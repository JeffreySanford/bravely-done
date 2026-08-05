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
- [ ] Start, pause, resume, and recover a sprint from timestamps.
- [x] Resolve complete or retreat — two of Plan 03's original five resolutions (complete, continue,
      split, retreat, call party) are real: `POST /quests/:id/complete` and `POST /quests/:id/retreat`
      (`apps/backend/src/quest/quest.service.ts`), both accepting a quest from either `OPEN` or
      `IN_PROGRESS`. Retreat is a deliberate, penalty-free resolution ("rest days and comeback quests
      are legitimate play" — documentation/product/rewards-retention.md's ethical rules), not a failure
      state. "Continue" (pause/resume a sprint), "split" (partial credit), and "call party" (needs the
      social/guild system, a later milestone) are still open — they need concepts (sprints, parties)
      this project doesn't have yet, not just another enum value.
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
      "Quest XP for completion" and "Coins for ordinary progress" reward categories. The richer
      Courage/Focus/Wisdom XP categories from that doc need sprint/resolution variety this project
      doesn't have yet — only the one "Quest XP" category is real. Coins aren't spendable on anything
      yet — no shop/upgrade system exists.
- [x] Reflect authoritative result in NgRx — `apps/frontend/src/app/state/quests/` (actions, reducer,
      effects) is this project's first real NgRx feature, backed by the actual API, not local component
      state, now including xp/coins/retreat alongside the original quest list and construction stage.
      This is also the domain-state foundation the rest of this plan (encounters, sprints, "continue"/
      "split"/"call party" resolutions) will extend rather than replace.
- [ ] Trigger accessible celebration. A level number now displays (client-side `Math.floor(xp/100)+1`,
      no server-side leveling logic), but there's no animated/accessible celebration moment on reward
      grant — just a text update.
- [x] Restore exact state after reload — verified live: complete and retreat quests, reload the page,
      the quest list, resolution states, bridge construction stage, xp, and coins are all unchanged
      (backed by Postgres via the NgRx effects re-fetching on load, not client-only state).
- [x] Cover the journey through unit and Playwright tests (backend service/controller unit tests
      including the transactional reward grant and start/retreat idempotency, NgRx reducer/effects unit
      tests, and a 3-engine Playwright e2e run that creates four quests, retreats one straight from the
      Backlog column, starts and completes three others via the Kanban board, confirms the XP/coins/
      level display and bridge stage, then reloads and confirms everything persisted). No API
      integration test tier exists yet in this project (`apps/backend-e2e` only has a smoke test) —
      that's still open.

## What "finished" means here

This plan is not fully done — encounters, sprints, the "continue"/"split"/"call party" resolutions,
idempotency keys, and celebration moments are all still open, and are real, separate pieces of work,
not rounding errors. What's done is the core value: a quest can be created, visibly started, resolved
two different honest ways, and one of those ways grants a real, deterministic, transactionally-safe
reward that persists — which is what makes completing a quest feel like it matters, rather than just
checking a box. The Kanban board is a first honest step toward the player tracking their own
stories/quests the way the app teaches Agile/SAFe to work, but it's still just Backlog/In Progress/
Done/Retreated on top of the same simple Quest model — no swimlanes, WIP limits, story points, or
sprint association yet (that needs the sprint system this plan still doesn't have). Everything still
open builds on this foundation rather than replacing it.
