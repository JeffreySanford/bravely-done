import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { SprintApiService } from '../../core/sprint-api.service';
import { CreateSprintDto } from '../../api/models/create-sprint-dto';
import { SprintsActions } from './sprints.actions';

const GENERIC_ERROR = 'Something went wrong. Please try again.';

/** Surfaces the backend's real message (e.g. "Sprint target duration has
 * not been reached yet", "Quest must be in progress to start a sprint")
 * instead of a generic fallback — both are real, user-actionable failure
 * modes, not just transient network errors. */
function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse && typeof err.error?.message === 'string') {
    return err.error.message;
  }
  return GENERIC_ERROR;
}

@Injectable()
export class SprintsEffects {
  private readonly actions$ = inject(Actions);
  private readonly sprintApi = inject(SprintApiService);

  // mergeMap throughout: each action targets one quest/sprint by id, and
  // the backend is atomic/idempotent per entity — unlike a single-slot
  // "resolvingQuestId" resolution, a player can legitimately have sprints
  // in flight on more than one Kanban card at once, so nothing here should
  // block on a different quest's transition.
  loadSprints$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SprintsActions.loadSprints),
      mergeMap(({ questId }) =>
        this.sprintApi.list(questId).pipe(
          map((sprints) => SprintsActions.loadSprintsSuccess({ questId, sprints })),
          catchError(() => of(SprintsActions.loadSprintsFailure({ questId, error: GENERIC_ERROR }))),
        ),
      ),
    ),
  );

  startSprint$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SprintsActions.startSprint),
      mergeMap(({ questId, targetSeconds }) =>
        this.sprintApi.start(questId, { targetSeconds } as CreateSprintDto).pipe(
          map((sprint) => SprintsActions.startSprintSuccess({ sprint })),
          catchError((err) => of(SprintsActions.startSprintFailure({ questId, error: errorMessage(err) }))),
        ),
      ),
    ),
  );

  pauseSprint$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SprintsActions.pauseSprint),
      mergeMap(({ sprintId }) =>
        this.sprintApi.pause(sprintId).pipe(
          map((sprint) => SprintsActions.pauseSprintSuccess({ sprint })),
          catchError(() => of(SprintsActions.pauseSprintFailure({ error: GENERIC_ERROR }))),
        ),
      ),
    ),
  );

  resumeSprint$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SprintsActions.resumeSprint),
      mergeMap(({ sprintId }) =>
        this.sprintApi.resume(sprintId).pipe(
          map((sprint) => SprintsActions.resumeSprintSuccess({ sprint })),
          catchError(() => of(SprintsActions.resumeSprintFailure({ error: GENERIC_ERROR }))),
        ),
      ),
    ),
  );

  completeSprint$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SprintsActions.completeSprint),
      mergeMap(({ sprintId }) =>
        this.sprintApi.complete(sprintId).pipe(
          map(({ sprint, character }) => SprintsActions.completeSprintSuccess({ sprint, xp: character.xp })),
          catchError((err) => of(SprintsActions.completeSprintFailure({ error: errorMessage(err) }))),
        ),
      ),
    ),
  );
}
