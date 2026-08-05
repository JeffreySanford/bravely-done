import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { EncounterApiService } from '../../core/encounter-api.service';
import { EncountersActions } from './encounters.actions';
import { EncountersEffects } from './encounters.effects';

const encounter = {
  id: 'enc-1',
  questId: 'q1',
  title: 'Draft the reply',
  status: 'OPEN' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  completedAt: null,
};

describe('EncountersEffects', () => {
  let actions$: Observable<unknown>;
  let effects: EncountersEffects;
  let encounterApi: jest.Mocked<Pick<EncounterApiService, 'create' | 'list' | 'complete'>>;

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        EncountersEffects,
        provideMockActions(() => actions$),
        { provide: EncounterApiService, useValue: encounterApi },
      ],
    });
    effects = TestBed.inject(EncountersEffects);
  }

  beforeEach(() => {
    encounterApi = {
      create: jest.fn(),
      list: jest.fn(),
      complete: jest.fn(),
    };
  });

  describe('loadEncounters$', () => {
    it('emits loadEncountersSuccess on success', (done) => {
      encounterApi.list.mockReturnValue(of([encounter]));
      actions$ = of(EncountersActions.loadEncounters({ questId: 'q1' }));
      setup();

      effects.loadEncounters$.subscribe((action) => {
        expect(encounterApi.list).toHaveBeenCalledWith('q1');
        expect(action).toEqual(EncountersActions.loadEncountersSuccess({ questId: 'q1', encounters: [encounter] }));
        done();
      });
    });

    it('emits loadEncountersFailure on error', (done) => {
      encounterApi.list.mockReturnValue(throwError(() => new Error('boom')));
      actions$ = of(EncountersActions.loadEncounters({ questId: 'q1' }));
      setup();

      effects.loadEncounters$.subscribe((action) => {
        expect(action.type).toBe(EncountersActions.loadEncountersFailure.type);
        done();
      });
    });
  });

  describe('createEncounter$', () => {
    it('emits createEncounterSuccess on success', (done) => {
      encounterApi.create.mockReturnValue(of(encounter));
      actions$ = of(EncountersActions.createEncounter({ questId: 'q1', title: 'Draft the reply' }));
      setup();

      effects.createEncounter$.subscribe((action) => {
        expect(encounterApi.create).toHaveBeenCalledWith('q1', { title: 'Draft the reply' });
        expect(action).toEqual(EncountersActions.createEncounterSuccess({ encounter }));
        done();
      });
    });

    it('emits createEncounterFailure on error', (done) => {
      encounterApi.create.mockReturnValue(throwError(() => new Error('boom')));
      actions$ = of(EncountersActions.createEncounter({ questId: 'q1', title: 'Draft the reply' }));
      setup();

      effects.createEncounter$.subscribe((action) => {
        expect(action.type).toBe(EncountersActions.createEncounterFailure.type);
        done();
      });
    });
  });

  describe('completeEncounter$', () => {
    it('emits completeEncounterSuccess with the granted xp on success', (done) => {
      const completed = { ...encounter, status: 'COMPLETED' as const, completedAt: '2026-01-01T00:05:00.000Z' };
      const character = {
        id: 'c1',
        name: 'Ember Scout',
        createdAt: '2026-01-01T00:00:00.000Z',
        hasArrivedAtCamp: true,
        campConstructionStage: 1,
        xp: 5,
        coins: 0,
      };
      encounterApi.complete.mockReturnValue(of({ encounter: completed, character }));
      actions$ = of(EncountersActions.completeEncounter({ encounterId: 'enc-1' }));
      setup();

      effects.completeEncounter$.subscribe((action) => {
        expect(encounterApi.complete).toHaveBeenCalledWith('enc-1');
        expect(action).toEqual(EncountersActions.completeEncounterSuccess({ encounter: completed, xp: 5 }));
        done();
      });
    });

    it('emits completeEncounterFailure on error', (done) => {
      encounterApi.complete.mockReturnValue(throwError(() => new Error('boom')));
      actions$ = of(EncountersActions.completeEncounter({ encounterId: 'enc-1' }));
      setup();

      effects.completeEncounter$.subscribe((action) => {
        expect(action.type).toBe(EncountersActions.completeEncounterFailure.type);
        done();
      });
    });
  });
});
