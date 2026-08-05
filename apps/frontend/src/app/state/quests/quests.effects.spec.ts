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
  let questApi: jest.Mocked<Pick<QuestApiService, 'list' | 'create' | 'start' | 'continue' | 'complete' | 'retreat' | 'split'>>;

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
      start: jest.fn(),
      continue: jest.fn(),
      complete: jest.fn(),
      retreat: jest.fn(),
      split: jest.fn(),
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

  describe('startQuest$', () => {
    it('emits startQuestSuccess on success', (done) => {
      questApi.start.mockReturnValue(of({ ...quest, status: 'IN_PROGRESS' as const }));
      actions$ = of(QuestsActions.startQuest({ questId: 'q1' }));
      setup();

      effects.startQuest$.subscribe((action) => {
        expect(questApi.start).toHaveBeenCalledWith('q1');
        expect(action).toEqual(QuestsActions.startQuestSuccess({ quest: { ...quest, status: 'IN_PROGRESS' } }));
        done();
      });
    });

    it('emits startQuestFailure on error', (done) => {
      questApi.start.mockReturnValue(throwError(() => new Error('boom')));
      actions$ = of(QuestsActions.startQuest({ questId: 'q1' }));
      setup();

      effects.startQuest$.subscribe((action) => {
        expect(action.type).toBe(QuestsActions.startQuestFailure.type);
        done();
      });
    });
  });

  describe('continueQuest$', () => {
    it('emits continueQuestSuccess on success', (done) => {
      const continued = { ...quest, status: 'IN_PROGRESS' as const };
      questApi.continue.mockReturnValue(of(continued));
      actions$ = of(QuestsActions.continueQuest({ questId: 'q1', idempotencyKey: 'key-1' }));
      setup();

      effects.continueQuest$.subscribe((action) => {
        expect(questApi.continue).toHaveBeenCalledWith('q1', 'key-1');
        expect(action).toEqual(QuestsActions.continueQuestSuccess({ quest: continued }));
        done();
      });
    });

    it('emits continueQuestFailure on error', (done) => {
      questApi.continue.mockReturnValue(throwError(() => new Error('boom')));
      actions$ = of(QuestsActions.continueQuest({ questId: 'q1', idempotencyKey: 'key-1' }));
      setup();

      effects.continueQuest$.subscribe((action) => {
        expect(action.type).toBe(QuestsActions.continueQuestFailure.type);
        done();
      });
    });
  });

  describe('completeQuest$', () => {
    it('emits completeQuestSuccess with the new construction stage, xp, and coins on success', (done) => {
      const character = { id: 'c1', name: 'Ember Scout', createdAt: '2026-01-01', hasArrivedAtCamp: true, campConstructionStage: 1, xp: 20, coins: 10 };
      questApi.complete.mockReturnValue(of({ quest: { ...quest, status: 'COMPLETED' as const }, character }));
      actions$ = of(QuestsActions.completeQuest({ questId: 'q1', idempotencyKey: 'key-1' }));
      setup();

      effects.completeQuest$.subscribe((action) => {
        expect(questApi.complete).toHaveBeenCalledWith('q1', 'key-1');
        expect(action).toEqual(
          QuestsActions.completeQuestSuccess({
            quest: { ...quest, status: 'COMPLETED' },
            constructionStage: 1,
            xp: 20,
            coins: 10,
          }),
        );
        done();
      });
    });

    it('emits completeQuestFailure on error', (done) => {
      questApi.complete.mockReturnValue(throwError(() => new Error('boom')));
      actions$ = of(QuestsActions.completeQuest({ questId: 'q1', idempotencyKey: 'key-1' }));
      setup();

      effects.completeQuest$.subscribe((action) => {
        expect(action.type).toBe(QuestsActions.completeQuestFailure.type);
        done();
      });
    });
  });

  describe('retreatQuest$', () => {
    it('emits retreatQuestSuccess on success', (done) => {
      questApi.retreat.mockReturnValue(of({ ...quest, status: 'RETREATED' as const }));
      actions$ = of(QuestsActions.retreatQuest({ questId: 'q1', idempotencyKey: 'key-1' }));
      setup();

      effects.retreatQuest$.subscribe((action) => {
        expect(questApi.retreat).toHaveBeenCalledWith('q1', 'key-1');
        expect(action).toEqual(QuestsActions.retreatQuestSuccess({ quest: { ...quest, status: 'RETREATED' } }));
        done();
      });
    });

    it('emits retreatQuestFailure on error', (done) => {
      questApi.retreat.mockReturnValue(throwError(() => new Error('boom')));
      actions$ = of(QuestsActions.retreatQuest({ questId: 'q1', idempotencyKey: 'key-1' }));
      setup();

      effects.retreatQuest$.subscribe((action) => {
        expect(action.type).toBe(QuestsActions.retreatQuestFailure.type);
        done();
      });
    });
  });

  describe('splitQuest$', () => {
    it('emits splitQuestSuccess with xp and coins on success', (done) => {
      const character = { id: 'c1', name: 'Ember Scout', createdAt: '2026-01-01', hasArrivedAtCamp: true, campConstructionStage: 1, xp: 10, coins: 5 };
      questApi.split.mockReturnValue(of({ quest: { ...quest, status: 'SPLIT' as const }, character }));
      actions$ = of(QuestsActions.splitQuest({ questId: 'q1', idempotencyKey: 'key-1' }));
      setup();

      effects.splitQuest$.subscribe((action) => {
        expect(questApi.split).toHaveBeenCalledWith('q1', 'key-1');
        expect(action).toEqual(
          QuestsActions.splitQuestSuccess({ quest: { ...quest, status: 'SPLIT' }, xp: 10, coins: 5 }),
        );
        done();
      });
    });

    it('emits splitQuestFailure on error', (done) => {
      questApi.split.mockReturnValue(throwError(() => new Error('boom')));
      actions$ = of(QuestsActions.splitQuest({ questId: 'q1', idempotencyKey: 'key-1' }));
      setup();

      effects.splitQuest$.subscribe((action) => {
        expect(action.type).toBe(QuestsActions.splitQuestFailure.type);
        done();
      });
    });
  });
});
