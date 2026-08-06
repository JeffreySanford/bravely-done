import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { ChronicleApiService } from '../../core/chronicle-api.service';
import { ChronicleActions } from './chronicle.actions';

const GENERIC_ERROR = 'Something went wrong. Please try again.';

@Injectable()
export class ChronicleEffects {
  private readonly actions$ = inject(Actions);
  private readonly chronicleApi = inject(ChronicleApiService);

  loadChronicle$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ChronicleActions.loadChronicle),
      exhaustMap(({ characterId }) =>
        this.chronicleApi.forCharacter(characterId).pipe(
          map((chronicle) =>
            ChronicleActions.loadChronicleSuccess({ chronicle }),
          ),
          catchError(() =>
            of(ChronicleActions.loadChronicleFailure({ error: GENERIC_ERROR })),
          ),
        ),
      ),
    ),
  );
}
