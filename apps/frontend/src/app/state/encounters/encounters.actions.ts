import { createActionGroup, props } from '@ngrx/store';
import { EncounterDto } from '../../api/models/encounter-dto';

/**
 * The encounters feature's public action surface. Unlike sprints (one slot
 * per quest), a quest can hold several encounters, so state is keyed by
 * questId to a full list — see encounters.reducer.ts.
 */
export const EncountersActions = createActionGroup({
  source: 'Encounters',
  events: {
    'Load Encounters': props<{ questId: string }>(),
    'Load Encounters Success': props<{ questId: string; encounters: EncounterDto[] }>(),
    'Load Encounters Failure': props<{ questId: string; error: string }>(),

    'Create Encounter': props<{ questId: string; title: string }>(),
    'Create Encounter Success': props<{ encounter: EncounterDto }>(),
    'Create Encounter Failure': props<{ questId: string; error: string }>(),

    'Complete Encounter': props<{ encounterId: string }>(),
    'Complete Encounter Success': props<{ encounter: EncounterDto; xp: number }>(),
    'Complete Encounter Failure': props<{ error: string }>(),
  },
});
