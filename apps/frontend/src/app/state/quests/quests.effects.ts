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
      exhaustMap(({ questId }) =>
        this.questApi.continue(questId).pipe(
          map((quest) => QuestsActions.continueQuestSuccess({ quest })),
          catchError(() => of(QuestsActions.continueQuestFailure({ error: GENERIC_ERROR }))),
        ),
      ),
    ),
  );

  completeQuest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuestsActions.completeQuest),
      exhaustMap(({ questId }) =>
        this.questApi.complete(questId).pipe(
          map(({ quest, character }) =>
            QuestsActions.completeQuestSuccess({
              quest,
              constructionStage: character.campConstructionStage,
              xp: character.xp,
              coins: character.coins,
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
      exhaustMap(({ questId }) =>
        this.questApi.retreat(questId).pipe(
          map((quest) => QuestsActions.retreatQuestSuccess({ quest })),
          catchError(() => of(QuestsActions.retreatQuestFailure({ error: GENERIC_ERROR }))),
        ),
      ),
    ),
  );
}
