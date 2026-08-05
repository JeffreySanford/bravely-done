import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { SprintApiService } from '../../core/sprint-api.service';
import { SprintsActions } from './sprints.actions';
import { SprintsEffects } from './sprints.effects';

const sprint = {
  id: 's1',
  questId: 'q1',
  targetSeconds: 900,
  startedAt: '2026-01-01T00:00:00.000Z',
  pausedAt: null,
  pausedSeconds: 0,
  status: 'ACTIVE' as const,
  completedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('SprintsEffects', () => {
  let actions$: Observable<unknown>;
  let effects: SprintsEffects;
  let sprintApi: jest.Mocked<Pick<SprintApiService, 'start' | 'list' | 'pause' | 'resume' | 'complete'>>;

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        SprintsEffects,
        provideMockActions(() => actions$),
        { provide: SprintApiService, useValue: sprintApi },
      ],
    });
    effects = TestBed.inject(SprintsEffects);
  }

  beforeEach(() => {
    sprintApi = {
      start: jest.fn(),
      list: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      complete: jest.fn(),
    };
  });

  describe('loadSprints$', () => {
    it('emits loadSprintsSuccess on success', (done) => {
      sprintApi.list.mockReturnValue(of([sprint]));
      actions$ = of(SprintsActions.loadSprints({ questId: 'q1' }));
      setup();

      effects.loadSprints$.subscribe((action) => {
        expect(sprintApi.list).toHaveBeenCalledWith('q1');
        expect(action).toEqual(SprintsActions.loadSprintsSuccess({ questId: 'q1', sprints: [sprint] }));
        done();
      });
    });

    it('emits loadSprintsFailure on error', (done) => {
      sprintApi.list.mockReturnValue(throwError(() => new Error('boom')));
      actions$ = of(SprintsActions.loadSprints({ questId: 'q1' }));
      setup();

      effects.loadSprints$.subscribe((action) => {
        expect(action.type).toBe(SprintsActions.loadSprintsFailure.type);
        done();
      });
    });
  });

  describe('startSprint$', () => {
    it('emits startSprintSuccess on success', (done) => {
      sprintApi.start.mockReturnValue(of(sprint));
      actions$ = of(SprintsActions.startSprint({ questId: 'q1', targetSeconds: 900 }));
      setup();

      effects.startSprint$.subscribe((action) => {
        expect(sprintApi.start).toHaveBeenCalledWith('q1', { targetSeconds: 900 });
        expect(action).toEqual(SprintsActions.startSprintSuccess({ sprint }));
        done();
      });
    });

    it('emits startSprintFailure with the backend message when the request fails with one', (done) => {
      const httpError = new HttpErrorResponse({ error: { message: 'Quest must be in progress to start a sprint' } });
      sprintApi.start.mockReturnValue(throwError(() => httpError));
      actions$ = of(SprintsActions.startSprint({ questId: 'q1', targetSeconds: 900 }));
      setup();

      effects.startSprint$.subscribe((action) => {
        expect(action).toEqual(
          SprintsActions.startSprintFailure({ questId: 'q1', error: 'Quest must be in progress to start a sprint' }),
        );
        done();
      });
    });
  });

  describe('pauseSprint$', () => {
    it('emits pauseSprintSuccess on success', (done) => {
      const paused = { ...sprint, status: 'PAUSED' as const, pausedAt: '2026-01-01T00:05:00.000Z' };
      sprintApi.pause.mockReturnValue(of(paused));
      actions$ = of(SprintsActions.pauseSprint({ sprintId: 's1' }));
      setup();

      effects.pauseSprint$.subscribe((action) => {
        expect(sprintApi.pause).toHaveBeenCalledWith('s1');
        expect(action).toEqual(SprintsActions.pauseSprintSuccess({ sprint: paused }));
        done();
      });
    });

    it('emits pauseSprintFailure on error', (done) => {
      sprintApi.pause.mockReturnValue(throwError(() => new Error('boom')));
      actions$ = of(SprintsActions.pauseSprint({ sprintId: 's1' }));
      setup();

      effects.pauseSprint$.subscribe((action) => {
        expect(action.type).toBe(SprintsActions.pauseSprintFailure.type);
        done();
      });
    });
  });

  describe('resumeSprint$', () => {
    it('emits resumeSprintSuccess on success', (done) => {
      sprintApi.resume.mockReturnValue(of(sprint));
      actions$ = of(SprintsActions.resumeSprint({ sprintId: 's1' }));
      setup();

      effects.resumeSprint$.subscribe((action) => {
        expect(sprintApi.resume).toHaveBeenCalledWith('s1');
        expect(action).toEqual(SprintsActions.resumeSprintSuccess({ sprint }));
        done();
      });
    });

    it('emits resumeSprintFailure on error', (done) => {
      sprintApi.resume.mockReturnValue(throwError(() => new Error('boom')));
      actions$ = of(SprintsActions.resumeSprint({ sprintId: 's1' }));
      setup();

      effects.resumeSprint$.subscribe((action) => {
        expect(action.type).toBe(SprintsActions.resumeSprintFailure.type);
        done();
      });
    });
  });

  describe('completeSprint$', () => {
    it('emits completeSprintSuccess with the granted xp on success', (done) => {
      const completed = { ...sprint, status: 'COMPLETED' as const, completedAt: '2026-01-01T00:15:00.000Z' };
      const character = {
        id: 'c1',
        name: 'Ember Scout',
        createdAt: '2026-01-01T00:00:00.000Z',
        hasArrivedAtCamp: true,
        campConstructionStage: 1,
        xp: 15,
        coins: 0,
      };
      sprintApi.complete.mockReturnValue(of({ sprint: completed, character }));
      actions$ = of(SprintsActions.completeSprint({ sprintId: 's1' }));
      setup();

      effects.completeSprint$.subscribe((action) => {
        expect(sprintApi.complete).toHaveBeenCalledWith('s1');
        expect(action).toEqual(SprintsActions.completeSprintSuccess({ sprint: completed, xp: 15 }));
        done();
      });
    });

    it('emits completeSprintFailure with the backend message when the request fails with one', (done) => {
      const httpError = new HttpErrorResponse({ error: { message: 'Sprint target duration has not been reached yet' } });
      sprintApi.complete.mockReturnValue(throwError(() => httpError));
      actions$ = of(SprintsActions.completeSprint({ sprintId: 's1' }));
      setup();

      effects.completeSprint$.subscribe((action) => {
        expect(action).toEqual(
          SprintsActions.completeSprintFailure({ error: 'Sprint target duration has not been reached yet' }),
        );
        done();
      });
    });

    it('emits completeSprintFailure with a generic message when the error has no message', (done) => {
      sprintApi.complete.mockReturnValue(throwError(() => new Error('network down')));
      actions$ = of(SprintsActions.completeSprint({ sprintId: 's1' }));
      setup();

      effects.completeSprint$.subscribe((action) => {
        expect(action).toEqual(
          SprintsActions.completeSprintFailure({ error: 'Something went wrong. Please try again.' }),
        );
        done();
      });
    });
  });
});
