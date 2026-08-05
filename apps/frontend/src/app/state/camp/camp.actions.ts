import { createActionGroup, props } from '@ngrx/store';

/**
 * The camp feature's public action surface — resource-gathering and
 * workbench-upgrade state (firewood, forage, workbenchLevel), separate
 * from the quests feature (which owns xp/coins). See planning/02-base-
 * camp-animations.md's resource loop.
 */
export const CampActions = createActionGroup({
  source: 'Camp',
  events: {
    'Set Character Context': props<{ characterId: string; firewoodCount: number; forageCount: number; workbenchLevel: number }>(),

    'Chop Tree': props<{ characterId: string }>(),
    'Chop Tree Success': props<{ firewoodCount: number }>(),
    'Chop Tree Failure': props<{ error: string }>(),

    'Forage': props<{ characterId: string }>(),
    'Forage Success': props<{ forageCount: number }>(),
    'Forage Failure': props<{ error: string }>(),

    'Upgrade Workbench': props<{ characterId: string }>(),
    'Upgrade Workbench Success': props<{ workbenchLevel: number; coins: number }>(),
    'Upgrade Workbench Failure': props<{ error: string }>(),
  },
});
