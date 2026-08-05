import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { QuestApiService } from '../../core/quest-api.service';
import { QuestsActions } from './quests.actions';

const GENERIC_ERROR = 'Something went wrong. Please try again.';

@Injectable()
export class QuestsEffects {
  private readonly actions$ = inject(Actions);
  private readonly questApi = inject(QuestApiService);

  loadQuests$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuestsActions.loadQuests),
      exhaustMap(({ characterId }) =>
        this.questApi.list(characterId).pipe(
          map((quests) => QuestsActions.loadQuestsSuccess({ quests })),
          catchError(() => of(QuestsActions.loadQuestsFailure({ error: GENERIC_ERROR }))),
        ),
      ),
    ),
  );

  createQuest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuestsActions.createQuest),
      exhaustMap(({ characterId, title }) =>
        this.questApi.create(characterId, { title }).pipe(
          map((quest) => QuestsActions.createQuestSuccess({ quest })),
          catchError(() => of(QuestsActions.createQuestFailure({ error: GENERIC_ERROR }))),
        ),
      ),
    ),
  );

  startQuest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuestsActions.startQuest),
      exhaustMap(({ questId }) =>
        this.questApi.start(questId).pipe(
          map((quest) => QuestsActions.startQuestSuccess({ quest })),
          catchError(() => of(QuestsActions.startQuestFailure({ error: GENERIC_ERROR }))),
        ),
      ),
    ),
  );

  continueQuest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuestsActions.continueQuest),
      exhaustMap(({ questId, idempotencyKey }) =>
        this.questApi.continue(questId, idempotencyKey).pipe(
          map((quest) => QuestsActions.continueQuestSuccess({ quest })),
          catchError(() => of(QuestsActions.continueQuestFailure({ error: GENERIC_ERROR }))),
        ),
      ),
    ),
  );

  completeQuest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuestsActions.completeQuest),
      exhaustMap(({ questId, idempotencyKey }) =>
        this.questApi.complete(questId, idempotencyKey).pipe(
          map(({ quest, character, firstBraveStepBonusGranted, todaysThreeBonusGranted }) =>
            QuestsActions.completeQuestSuccess({
              quest,
              constructionStage: character.campConstructionStage,
              xp: character.xp,
              coins: character.coins,
              firstBraveStepBonusGranted,
              todaysThreeBonusGranted,
            }),
          ),
          catchError(() => of(QuestsActions.completeQuestFailure({ error: GENERIC_ERROR }))),
        ),
      ),
    ),
  );

  retreatQuest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuestsActions.retreatQuest),
      exhaustMap(({ questId, idempotencyKey }) =>
        this.questApi.retreat(questId, idempotencyKey).pipe(
          map((quest) => QuestsActions.retreatQuestSuccess({ quest })),
          catchError(() => of(QuestsActions.retreatQuestFailure({ error: GENERIC_ERROR }))),
        ),
      ),
    ),
  );

  splitQuest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuestsActions.splitQuest),
      exhaustMap(({ questId, idempotencyKey }) =>
        this.questApi.split(questId, idempotencyKey).pipe(
          map(({ quest, character }) =>
            QuestsActions.splitQuestSuccess({ quest, xp: character.xp, coins: character.coins }),
          ),
          catchError(() => of(QuestsActions.splitQuestFailure({ error: GENERIC_ERROR }))),
        ),
      ),
    ),
  );

  designateTodaysThree$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuestsActions.designateTodaysThree),
      exhaustMap(({ questId }) =>
        this.questApi.designateTodaysThree(questId).pipe(
          map((quest) => QuestsActions.designateTodaysThreeSuccess({ quest })),
          catchError(() => of(QuestsActions.designateTodaysThreeFailure({ error: GENERIC_ERROR }))),
        ),
      ),
    ),
  );

  undesignateTodaysThree$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuestsActions.undesignateTodaysThree),
      exhaustMap(({ questId }) =>
        this.questApi.undesignateTodaysThree(questId).pipe(
          map((quest) => QuestsActions.undesignateTodaysThreeSuccess({ quest })),
          catchError(() => of(QuestsActions.undesignateTodaysThreeFailure({ error: GENERIC_ERROR }))),
        ),
      ),
    ),
  );
}
