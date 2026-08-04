import { createActionGroup, props } from '@ngrx/store';

/**
 * The camp feature's public action surface — resource-gathering state
 * (currently just firewood), separate from the quests feature. See
 * planning/02-base-camp-animations.md's resource loop.
 */
export const CampActions = createActionGroup({
  source: 'Camp',
  events: {
    'Set Character Context': props<{ characterId: string; firewoodCount: number }>(),

    'Chop Tree': props<{ characterId: string }>(),
    'Chop Tree Success': props<{ firewoodCount: number }>(),
    'Chop Tree Failure': props<{ error: string }>(),
  },
});
