# Plan 03: First Brave Step

- [x] Define a minimal Quest contract (`title`, `status: OPEN | IN_PROGRESS | COMPLETED | RETREATED |
      SPLIT`, `characterId`) — real, not a mock stub. This is deliberately just enough to make quest
      completion, several alternate resolutions, and a real "in progress" signal durable, not the full
      loop (no parties/guilds yet).
- [x] Render the quest board as a real Kanban board (Backlog/In Progress/Done/Split/Retreated columns,
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
- [x] Resolve complete, continue, retreat, or split — four of Plan 03's original five resolutions
      (complete, continue, split, retreat, call party) are real: `POST /quests/:id/complete`, `POST /
      quests/:id/continue`, `POST /quests/:id/retreat`, and `POST /quests/:id/split`
      (`apps/backend/src/quest/quest.service.ts`), all four accepting a quest from either `OPEN` or
      `IN_PROGRESS`. Continue moves an `OPEN` quest to `IN_PROGRESS` (same as start) and re-stamps an
      already-`IN_PROGRESS` one; it's a genuine no-op only once the quest has moved on to
      `COMPLETED`/`RETREATED`/`SPLIT`. Retreat is a deliberate, penalty-free resolution ("rest days and
      comeback quests are legitimate play" — documentation/product/rewards-retention.md's ethical
      rules), not a failure state. Continue stamps `Quest.lastContinuedAt` (re-stamped on every call, not
      just the first, since a player may continue the same quest across many sessions) and leaves the
      quest `IN_PROGRESS` — no reward, matching retreat's reward-free precedent, and no column change on
      the Kanban board (a "Continue" button just sits alongside Retreat/Split/Complete on In Progress
      cards). It's durable history for a future Chronicle/session-summary feature, not surfaced
      prominently yet. Split grants half `QUEST_XP_REWARD`/`QUEST_COIN_REWARD` (rounded down —
      `SPLIT_XP_REWARD`/`SPLIT_COIN_REWARD`) and moves the quest to a real `SPLIT` Kanban column — partial
      credit for a quest that made real progress but won't be finished as scoped, distinct from both
      Complete (full credit) and Retreat (no credit). "Call party" (needs the social/guild system, a
      later milestone) is still open.
- [x] Submit resolution with idempotency key. `complete`/`continue`/`retreat`/`split` all accept an
      optional client-generated `idempotencyKey` (a fresh UUID per click — `crypto.randomUUID()` in
      `base-camp.ts`); `Quest.lastIdempotencyKey` stores the last one processed, and a duplicate network
      retry carrying the same key is returned as-is without re-executing the mutation
      (`QuestService.isDuplicateCall`). This matters most for `continue()`, which is deliberately NOT
      idempotent by status alone (it re-stamps `lastContinuedAt` on every real call) — without a key, a
      retry would be indistinguishable from a second genuine continue. Verified live: same key twice
      leaves the timestamp/reward unchanged, a fresh key re-applies normally, and a fresh key on an
      already-resolved quest still correctly no-ops (resolved status wins over the key check).
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
      state, now including xp/coins/retreat/split alongside the original quest list and construction
      stage; `apps/frontend/src/app/state/sprints/` and `apps/frontend/src/app/state/encounters/` follow
      the same pattern for the sprint timer and encounter checklist, with the quests reducer
      cross-syncing xp from both the same way it already does for coins from workbench upgrades. This is
      also the domain-state foundation the rest of this plan ("call party") will extend rather than
      replace.
- [x] Trigger accessible celebration. A level number still displays (client-side `Math.floor(xp/100)+1`,
      no server-side leveling logic), and now every reward grant (quest complete/split, sprint Focus XP,
      encounter Courage XP) also raises a `role="status"`/`aria-live="polite"` toast
      (`.celebration-toast` in `base-camp.html`/`.scss`) showing the actual XP/coins gained — a real
      screen-reader announcement, not just a visual flourish. The delta is computed once, in the NgRx
      reducer (`QuestsState.lastReward`), at the moment each reward-bearing success action lands — never
      in `setCharacterContext`, so a page load never replays a celebration for XP/coins the player
      already had, and a workbench upgrade (a coin *spend*) correctly never triggers one either.
      Respects `prefers-reduced-motion`: the full version rises/scales in and fades out over ~2.4s: the
      reduced version is the same duration with no movement, just an appear/hold/fade.
- [x] Restore exact state after reload — verified live: complete and retreat quests, reload the page,
      the quest list, resolution states, bridge construction stage, xp, and coins are all unchanged
      (backed by Postgres via the NgRx effects re-fetching on load, not client-only state). An in-flight
      sprint recovers the same way: `GET /quests/:questId/sprints` on load lets the board reconstruct
      the timer from the sprint's real stored timestamps, not from anything the client remembered.
- [x] Cover the journey through unit, integration, and Playwright tests (backend service/controller unit
      tests including the transactional reward grant, start/continue/retreat/split idempotency — both
      the natural status-based kind and the client-supplied idempotency-key kind — and the sprint
      completion gate's timestamp math specifically; NgRx reducer/effects unit tests for the quests,
      sprints, and encounters features including the celebration `lastReward` delta computation; a real
      API integration tier in `apps/backend-e2e` (`src/quest/quest-resolution.spec.ts`) that signs up
      real users and hits the actual running backend + Postgres — not mocked Prisma — covering
      complete/split/retreat/continue and both idempotency-key cases end to end; and a 3-engine
      Playwright e2e run that creates five quests, adds and completes an encounter straight from the
      Backlog column (Courage XP), retreats one quest, splits another (asserting the half reward, the
      Split column, and the accessible celebration toast), starts and completes three more via the
      Kanban board — including a full start/pause/resume sprint round trip on one of them, with "Finish
      sprint" asserted disabled the whole time as visible proof of the idle-timer-resistance guarantee,
      and a Continue click on another asserted to leave it in the In Progress column with no reward
      before it's completed normally — then confirms the XP/coins/level display and bridge stage,
      reloads, and confirms everything persisted). Reaching the sprint's success-after-target-duration
      path isn't practical in an e2e run (the shortest preset is 15 real minutes); that path is instead
      verified live against a real Postgres row (backdating `startedAt` directly, not mocking the
      clock — the same technique used to verify the unaffordable/idempotent workbench-upgrade cases).
      Building the encounter e2e coverage caught a real, unrelated bug: the encounter's plain
      `<form (ngSubmit)>` had no `[formGroup]`/`ngForm` directive attached (the component only imported
      `ReactiveFormsModule`, not `FormsModule`), so `ngSubmit` silently never fired and the browser fell
      back to a native full-page form submission on every encounter add — fixed by importing
      `FormsModule` alongside `ReactiveFormsModule`.

## What "finished" means here

This plan is not fully done — the "call party" quest resolution (needs the social/guild system) is
still open, and is real, separate work, not a rounding error. What's done is the core value: a quest
can be created, visibly started, broken into small encounters, worked on in a real timed sprint,
resolved four different honest ways (complete, continue, retreat, split), and all three of
quest/sprint/encounter grant real, deterministic, transactionally-safe rewards that persist and are
celebrated with a real accessible announcement — which is what makes completing a quest (and sitting
through an honest sprint, and taking a small brave step via an encounter) feel like it matters, rather
than just checking a box. The Kanban board is a first honest step toward the player tracking their own
stories/quests the way the app teaches Agile/SAFe to work, sprints give the "In Progress" column
something real happening inside it, encounters give a quest real internal structure, Continue lets a
session end with real progress logged without forcing a premature complete/retreat, and Split gives
partial credit its own honest resolution instead of forcing every unfinished quest into a binary
complete-or-retreat choice — but there's still no swimlanes, WIP limits, or story points. Everything
still open builds on this foundation rather than replacing it.
