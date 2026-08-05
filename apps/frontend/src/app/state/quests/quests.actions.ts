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

    'Continue Quest': props<{ questId: string }>(),
    'Continue Quest Success': props<{ quest: QuestDto }>(),
    'Continue Quest Failure': props<{ error: string }>(),

    'Complete Quest': props<{ questId: string }>(),
    'Complete Quest Success': props<{ quest: QuestDto; constructionStage: number; xp: number; coins: number }>(),
    'Complete Quest Failure': props<{ error: string }>(),

    'Retreat Quest': props<{ questId: string }>(),
    'Retreat Quest Success': props<{ quest: QuestDto }>(),
    'Retreat Quest Failure': props<{ error: string }>(),
  },
});
