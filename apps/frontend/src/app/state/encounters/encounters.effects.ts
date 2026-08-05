import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { EncounterApiService } from '../../core/encounter-api.service';
import { EncountersActions } from './encounters.actions';

const GENERIC_ERROR = 'Something went wrong. Please try again.';

@Injectable()
export class EncountersEffects {
  private readonly actions$ = inject(Actions);
  private readonly encounterApi = inject(EncounterApiService);

  // mergeMap throughout: each action targets one quest/encounter by id, and
  // a player can legitimately have encounters in flight on more than one
  // quest card at once — same reasoning as SprintsEffects.
  loadEncounters$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EncountersActions.loadEncounters),
      mergeMap(({ questId }) =>
        this.encounterApi.list(questId).pipe(
          map((encounters) => EncountersActions.loadEncountersSuccess({ questId, encounters })),
          catchError(() => of(EncountersActions.loadEncountersFailure({ questId, error: GENERIC_ERROR }))),
        ),
      ),
    ),
  );

  createEncounter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EncountersActions.createEncounter),
      mergeMap(({ questId, title }) =>
        this.encounterApi.create(questId, { title }).pipe(
          map((encounter) => EncountersActions.createEncounterSuccess({ encounter })),
          catchError(() => of(EncountersActions.createEncounterFailure({ questId, error: GENERIC_ERROR }))),
        ),
      ),
    ),
  );

  completeEncounter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EncountersActions.completeEncounter),
      mergeMap(({ encounterId }) =>
        this.encounterApi.complete(encounterId).pipe(
          map(({ encounter, character }) =>
            EncountersActions.completeEncounterSuccess({ encounter, xp: character.xp }),
          ),
          catchError(() => of(EncountersActions.completeEncounterFailure({ error: GENERIC_ERROR }))),
        ),
      ),
    ),
  );
}
