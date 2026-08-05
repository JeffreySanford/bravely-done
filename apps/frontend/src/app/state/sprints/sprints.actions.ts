import { createActionGroup, props } from '@ngrx/store';
import { SprintDto } from '../../api/models/sprint-dto';

/**
 * The sprints feature's public action surface. One sprint slot is tracked
 * per quest (`byQuestId`) — see sprints.reducer.ts. `loadSprints` is what
 * lets a reload recover an in-flight sprint from its stored timestamps
 * rather than losing it to client-only state.
 */
export const SprintsActions = createActionGroup({
  source: 'Sprints',
  events: {
    'Load Sprints': props<{ questId: string }>(),
    'Load Sprints Success': props<{ questId: string; sprints: SprintDto[] }>(),
    'Load Sprints Failure': props<{ questId: string; error: string }>(),

    'Start Sprint': props<{ questId: string; targetSeconds: number }>(),
    'Start Sprint Success': props<{ sprint: SprintDto }>(),
    'Start Sprint Failure': props<{ questId: string; error: string }>(),

    'Pause Sprint': props<{ sprintId: string }>(),
    'Pause Sprint Success': props<{ sprint: SprintDto }>(),
    'Pause Sprint Failure': props<{ error: string }>(),

    'Resume Sprint': props<{ sprintId: string }>(),
    'Resume Sprint Success': props<{ sprint: SprintDto }>(),
    'Resume Sprint Failure': props<{ error: string }>(),

    'Complete Sprint': props<{ sprintId: string }>(),
    'Complete Sprint Success': props<{ sprint: SprintDto; xp: number }>(),
    'Complete Sprint Failure': props<{ error: string }>(),
  },
});
