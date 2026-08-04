# Plan 03: First Brave Step

- [x] Define a minimal Quest contract (`title`, `status: OPEN | COMPLETED`, `characterId`) — real, not a
      mock stub. Encounter, Sprint, Resolution, RewardBundle, and CampMutation contracts are still open;
      this is deliberately just enough to make quest completion real and durable, not the full loop.
- [x] Create a quest in well under 20 seconds — a title field and one click on Base Camp's quest board
      (`apps/frontend/src/app/pages/base-camp/`), no encounter/sprint step yet.
- [ ] Suggest a small first encounter.
- [ ] Start, pause, resume, and recover a sprint from timestamps.
- [ ] Resolve complete, continue, split, retreat, or call party — currently only "complete" exists.
- [ ] Submit resolution with idempotency key.
- [x] Persist quest and camp (bridge construction) mutations atomically — `QuestService.complete`
      (`apps/backend/src/quest/quest.service.ts`) updates the quest and the character's
      `campConstructionStage` together. Reward/inventory mutations don't exist yet — no
      XP/coins/materials system is built.
- [x] Reflect authoritative result in NgRx — `apps/frontend/src/app/state/quests/` (actions, reducer,
      effects) is this project's first real NgRx feature, backed by the actual API, not local component
      state. This is also the domain-state foundation the rest of this plan (encounters, sprints,
      resolutions) will extend rather than replace.
- [ ] Trigger accessible celebration.
- [x] Restore exact state after reload — verified live: complete quests, reload the page, the quest
      list and bridge construction stage are unchanged (backed by Postgres via the NgRx effects
      re-fetching on load, not client-only state).
- [x] Cover the journey through unit and Playwright tests (backend service/controller unit tests, NgRx
      reducer/effects unit tests, and a 3-engine Playwright e2e run that creates and completes three
      quests and confirms persistence). No API integration test tier exists yet in this project
      (`apps/backend-e2e` only has a smoke test) — that's still open.
