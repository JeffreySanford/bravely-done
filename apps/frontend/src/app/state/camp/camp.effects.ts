import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, mergeMap, of } from 'rxjs';
import { CharacterApiService } from '../../core/character-api.service';
import { CampActions } from './camp.actions';

const GENERIC_ERROR = 'Something went wrong. Please try again.';

/** Surfaces the backend's actual message (e.g. "Not enough coins for the
 * next workbench upgrade") when present, instead of always falling back
 * to a generic one — the workbench upgrade is the one camp action with a
 * real, user-actionable failure mode (insufficient funds), not just a
 * transient network error. */
function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse && typeof err.error?.message === 'string') {
    return err.error.message;
  }
  return GENERIC_ERROR;
}

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

  // Same mergeMap reasoning as chopTree$.
  forage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CampActions.forage),
      mergeMap(({ characterId }) =>
        this.characterApi.forage(characterId).pipe(
          map((character) => CampActions.forageSuccess({ forageCount: character.forageCount })),
          catchError(() => of(CampActions.forageFailure({ error: GENERIC_ERROR }))),
        ),
      ),
    ),
  );

  // exhaustMap (not mergeMap): a purchase, not an ambient action — ignore
  // repeat clicks while one upgrade request is already in flight rather
  // than risk firing two in quick succession.
  upgradeWorkbench$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CampActions.upgradeWorkbench),
      exhaustMap(({ characterId }) =>
        this.characterApi.upgradeWorkbench(characterId).pipe(
          map((character) =>
            CampActions.upgradeWorkbenchSuccess({ workbenchLevel: character.workbenchLevel, coins: character.coins }),
          ),
          catchError((err) => of(CampActions.upgradeWorkbenchFailure({ error: errorMessage(err) }))),
        ),
      ),
    ),
  );
}
