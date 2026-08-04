import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { QuestApiService } from '../../core/quest-api.service';
import { QuestsActions } from './quests.actions';
import { QuestsEffects } from './quests.effects';

const quest = { id: 'q1', characterId: 'c1', title: 'Chop wood', status: 'OPEN' as const, createdAt: '2026-01-01', completedAt: null };

describe('QuestsEffects', () => {
  let actions$: Observable<unknown>;
  let effects: QuestsEffects;
  let questApi: jest.Mocked<Pick<QuestApiService, 'list' | 'create' | 'complete'>>;

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        QuestsEffects,
        provideMockActions(() => actions$),
        { provide: QuestApiService, useValue: questApi },
      ],
    });
    effects = TestBed.inject(QuestsEffects);
  }

  beforeEach(() => {
    questApi = {
      list: jest.fn(),
      create: jest.fn(),
      complete: jest.fn(),
    };
  });

  describe('loadQuests$', () => {
    it('emits loadQuestsSuccess on success', (done) => {
      questApi.list.mockReturnValue(of([quest]));
      actions$ = of(QuestsActions.loadQuests({ characterId: 'c1' }));
      setup();

      effects.loadQuests$.subscribe((action) => {
        expect(questApi.list).toHaveBeenCalledWith('c1');
        expect(action).toEqual(QuestsActions.loadQuestsSuccess({ quests: [quest] }));
        done();
      });
    });

    it('emits loadQuestsFailure on error', (done) => {
      questApi.list.mockReturnValue(throwError(() => new Error('boom')));
      actions$ = of(QuestsActions.loadQuests({ characterId: 'c1' }));
      setup();

      effects.loadQuests$.subscribe((action) => {
        expect(action.type).toBe(QuestsActions.loadQuestsFailure.type);
        done();
      });
    });
  });

  describe('createQuest$', () => {
    it('emits createQuestSuccess on success', (done) => {
      questApi.create.mockReturnValue(of(quest));
      actions$ = of(QuestsActions.createQuest({ characterId: 'c1', title: 'Chop wood' }));
      setup();

      effects.createQuest$.subscribe((action) => {
        expect(questApi.create).toHaveBeenCalledWith('c1', { title: 'Chop wood' });
        expect(action).toEqual(QuestsActions.createQuestSuccess({ quest }));
        done();
      });
    });

    it('emits createQuestFailure on error', (done) => {
      questApi.create.mockReturnValue(throwError(() => new Error('boom')));
      actions$ = of(QuestsActions.createQuest({ characterId: 'c1', title: 'Chop wood' }));
      setup();

      effects.createQuest$.subscribe((action) => {
        expect(action.type).toBe(QuestsActions.createQuestFailure.type);
        done();
      });
    });
  });

  describe('completeQuest$', () => {
    it('emits completeQuestSuccess with the new construction stage on success', (done) => {
      const character = { id: 'c1', name: 'Ember Scout', createdAt: '2026-01-01', hasArrivedAtCamp: true, campConstructionStage: 1 };
      questApi.complete.mockReturnValue(of({ quest: { ...quest, status: 'COMPLETED' as const }, character }));
      actions$ = of(QuestsActions.completeQuest({ questId: 'q1' }));
      setup();

      effects.completeQuest$.subscribe((action) => {
        expect(questApi.complete).toHaveBeenCalledWith('q1');
        expect(action).toEqual(
          QuestsActions.completeQuestSuccess({ quest: { ...quest, status: 'COMPLETED' }, constructionStage: 1 }),
        );
        done();
      });
    });

    it('emits completeQuestFailure on error', (done) => {
      questApi.complete.mockReturnValue(throwError(() => new Error('boom')));
      actions$ = of(QuestsActions.completeQuest({ questId: 'q1' }));
      setup();

      effects.completeQuest$.subscribe((action) => {
        expect(action.type).toBe(QuestsActions.completeQuestFailure.type);
        done();
      });
    });
  });
});
