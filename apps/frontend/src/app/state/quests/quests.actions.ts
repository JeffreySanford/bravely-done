import { createActionGroup, props } from '@ngrx/store';
import { QuestDto } from '../../api/models/quest-dto';

/**
 * The quests feature's public action surface. `QuestsActions.loadQuests`
 * etc. — see quests.reducer.ts for how these mutate state and
 * quests.effects.ts for how they reach the backend.
 */
export const QuestsActions = createActionGroup({
  source: 'Quests',
  events: {
    'Set Character Context': props<{ characterId: string; constructionStage: number; xp: number; coins: number }>(),

    'Load Quests': props<{ characterId: string }>(),
    'Load Quests Success': props<{ quests: QuestDto[] }>(),
    'Load Quests Failure': props<{ error: string }>(),

    'Create Quest': props<{ characterId: string; title: string }>(),
    'Create Quest Success': props<{ quest: QuestDto }>(),
    'Create Quest Failure': props<{ error: string }>(),

    'Start Quest': props<{ questId: string }>(),
    'Start Quest Success': props<{ quest: QuestDto }>(),
    'Start Quest Failure': props<{ error: string }>(),

    // idempotencyKey is a fresh client-generated UUID per click (see
    // base-camp.ts) — protects against a duplicate network retry
    // re-applying the same resolution twice (see QuestService.isDuplicateCall).
    'Continue Quest': props<{ questId: string; idempotencyKey: string }>(),
    'Continue Quest Success': props<{ quest: QuestDto }>(),
    'Continue Quest Failure': props<{ error: string }>(),

    'Complete Quest': props<{ questId: string; idempotencyKey: string }>(),
    'Complete Quest Success': props<{
      quest: QuestDto;
      constructionStage: number;
      xp: number;
      coins: number;
      firstBraveStepBonusGranted: boolean;
      todaysThreeBonusGranted: boolean;
    }>(),
    'Complete Quest Failure': props<{ error: string }>(),

    'Retreat Quest': props<{ questId: string; idempotencyKey: string }>(),
    'Retreat Quest Success': props<{ quest: QuestDto }>(),
    'Retreat Quest Failure': props<{ error: string }>(),

    'Split Quest': props<{ questId: string; idempotencyKey: string }>(),
    'Split Quest Success': props<{ quest: QuestDto; xp: number; coins: number }>(),
    'Split Quest Failure': props<{ error: string }>(),

    // Today's Three (rewards-retention.md's Daily cadence): up to 3 quests a
    // player can designate per UTC day for a bonus on completion. A
    // lightweight toggle, not a quest resolution, so it gets its own
    // in-flight tracking (togglingTodaysThreeQuestId) rather than sharing
    // resolvingQuestId.
    'Designate Todays Three': props<{ questId: string }>(),
    'Designate Todays Three Success': props<{ quest: QuestDto }>(),
    'Designate Todays Three Failure': props<{ error: string }>(),

    'Undesignate Todays Three': props<{ questId: string }>(),
    'Undesignate Todays Three Success': props<{ quest: QuestDto }>(),
    'Undesignate Todays Three Failure': props<{ error: string }>(),
  },
});
