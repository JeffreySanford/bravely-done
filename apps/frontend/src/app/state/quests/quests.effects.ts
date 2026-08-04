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

  completeQuest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuestsActions.completeQuest),
      exhaustMap(({ questId }) =>
        this.questApi.complete(questId).pipe(
          map(({ quest, character }) =>
            QuestsActions.completeQuestSuccess({ quest, constructionStage: character.campConstructionStage }),
          ),
          catchError(() => of(QuestsActions.completeQuestFailure({ error: GENERIC_ERROR }))),
        ),
      ),
    ),
  );
}
