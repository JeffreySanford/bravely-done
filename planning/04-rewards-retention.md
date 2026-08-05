# Plan 04: Rewards and Retention

- [ ] Define currencies, XP categories, materials, cosmetics, and treasury. (Partial: XP and coins
      are real, fed by five named reward categories — Quest XP, Focus XP, Courage XP, plus the Daily
      loop's First Brave Step and Today's Three bonuses. Wisdom XP, materials-as-a-counter, cosmetics,
      and treasury are still just names in documentation/product/rewards-retention.md.)
- [x] Create deterministic reward formula resistant to idle-time farming. Every reward in the game is
      a flat, deterministic constant granted only on a real player-driven completion — never on login,
      elapsed wall-clock time, or a passive tick. The sprint completion gate is the load-bearing case
      (`SprintService.complete` recomputes elapsed active time server-side from stored timestamps and
      rejects until the target is genuinely reached), and the Daily loop follows the same rule: the
      First Brave Step bonus fires on the day's first *completion*, not on opening the app, and the
      Today's Three bonus requires actually finishing a designated quest.
- [x] Add transaction ledger and idempotency. Idempotency is real: `complete`/`continue`/`retreat`/
      `split` all accept a client-generated `idempotencyKey`, and `Quest.lastIdempotencyKey` makes a
      duplicate network retry a safe no-op (see planning/03-first-brave-step.md). A separate
      append-only *ledger* table doesn't exist — reward history is currently implicit in the
      `Character` aggregate plus per-quest timestamps, which is enough for today's features but is
      what a future Chronicle would need.
- [x] Daily Campfire and First Brave Step bonus. The First Brave Step bonus
      (`FIRST_BRAVE_STEP_XP_REWARD` = 10, `FIRST_BRAVE_STEP_COIN_REWARD` = 5 —
      `apps/backend/src/quest/quest.service.ts`) is granted on the first quest a character *completes*
      each UTC day, tracked by `Character.firstBraveStepDay`. Deliberately not granted by `split()` —
      a split is explicitly "won't be finished as scoped," which doesn't match the bonus's "you
      finished something today" framing. The "Daily Campfire" welcome moment itself is still open: the
      campfire exists as a scene landmark with real fuel state, but there's no once-per-day welcome
      beat wired to it.
- [x] Today's Three. A player designates up to `TODAYS_THREE_MAX` = 3 of their own OPEN/IN_PROGRESS
      quests per UTC day (`POST`/`DELETE /quests/:id/todays-three`, tracked by `Quest.todaysThreeDay`);
      completing a designated quest grants `TODAYS_THREE_BONUS_XP_REWARD` = 10 /
      `TODAYS_THREE_BONUS_COIN_REWARD` = 5 on top of the normal reward. Player-chosen, not
      system-suggested — an auto-selection heuristic is a separate design problem this project hasn't
      solved. A stale designation from a previous day simply stops counting (compared against today's
      UTC day) rather than needing an expiry job. Rendered as a star toggle on Backlog/In Progress
      Kanban cards; `QuestDto.isTodaysThree` is computed server-side so the client never does its own
      day-boundary math.
- [ ] Weekly Expedition and Chronicle.
- [ ] Monthly Campaign chapter.
- [ ] Rest days, shields, and Comeback Quest. (Retreat is already a real penalty-free resolution —
      "rest days and comeback quests are legitimate play" — but there are no streak shields or a
      dedicated Comeback Quest flow, and deliberately no streak counter at all yet: streaks interact
      directly with the "no permanent loss after missing a day" ethical rule and deserve their own
      design pass rather than being rushed in alongside the daily bonuses.)
- [ ] Notification preferences and frequency caps.
- [ ] Economy simulation and abuse tests. (Partial: per-endpoint abuse cases are covered — the sprint
      idle-timer gate, the Today's Three 3-per-day cap, idempotent replays, and no-double-reward on
      every resolution, all with real-Postgres integration tests in `apps/backend-e2e`. There's no
      whole-economy simulation modeling long-run currency inflation.)
- [ ] Human playtest FUN evidence.

## What "finished" means here

The Daily cadence is now real end to end — a player can star up to three quests for the day and earn
a genuine, deterministic bonus for finishing them, plus a once-a-day bonus for simply starting to
finish anything at all. Both bonuses ride the existing transactional reward path, so they can't be
granted without the quest actually resolving, and neither is reachable by idling. The Weekly and
Monthly cadences (Expedition, Chronicle, Campaign chapter) are untouched, and each needs its own
scoping pass — they're substantially larger than the Daily slice, not simple repetitions of it at a
longer interval.
