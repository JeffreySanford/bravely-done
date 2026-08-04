import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { CharacterApiService } from '../../core/character-api.service';
import { CampActions } from './camp.actions';

const GENERIC_ERROR = 'Something went wrong. Please try again.';

@Injectable()
export class CampEffects {
  private readonly actions$ = inject(Actions);
  private readonly characterApi = inject(CharacterApiService);

  // mergeMap (not exhaustMap): chopping is meant to feel responsive to
  // repeated clicks, and the backend increments atomically, so concurrent
  // requests can't corrupt the count.
  chopTree$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CampActions.chopTree),
      mergeMap(({ characterId }) =>
        this.characterApi.chopTree(characterId).pipe(
          map((character) => CampActions.chopTreeSuccess({ firewoodCount: character.firewoodCount })),
          catchError(() => of(CampActions.chopTreeFailure({ error: GENERIC_ERROR }))),
        ),
      ),
    ),
  );
}
