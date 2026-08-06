import { createActionGroup, props } from '@ngrx/store';
import { ChronicleDto } from '../../api/models/chronicle-dto';

/**
 * The chronicle feature's action surface — a read-only slice, so there are
 * no mutation actions here, only a load.
 */
export const ChronicleActions = createActionGroup({
  source: 'Chronicle',
  events: {
    'Load Chronicle': props<{ characterId: string }>(),
    'Load Chronicle Success': props<{ chronicle: ChronicleDto }>(),
    'Load Chronicle Failure': props<{ error: string }>(),
  },
});
