import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { CharacterApiService } from '../../core/character-api.service';
import { CampActions } from './camp.actions';
import { CampEffects } from './camp.effects';

describe('CampEffects', () => {
  let actions$: Observable<unknown>;
  let effects: CampEffects;
  let characterApi: jest.Mocked<Pick<CharacterApiService, 'chopTree' | 'forage'>>;

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        CampEffects,
        provideMockActions(() => actions$),
        { provide: CharacterApiService, useValue: characterApi },
      ],
    });
    effects = TestBed.inject(CampEffects);
  }

  beforeEach(() => {
    characterApi = { chopTree: jest.fn(), forage: jest.fn() };
  });

  it('emits chopTreeSuccess with the new firewood count on success', (done) => {
    characterApi.chopTree.mockReturnValue(
      of({ id: 'c1', name: 'Ember Scout', createdAt: '2026-01-01', hasArrivedAtCamp: true, campConstructionStage: 0, firewoodCount: 1 }),
    );
    actions$ = of(CampActions.chopTree({ characterId: 'c1' }));
    setup();

    effects.chopTree$.subscribe((action) => {
      expect(characterApi.chopTree).toHaveBeenCalledWith('c1');
      expect(action).toEqual(CampActions.chopTreeSuccess({ firewoodCount: 1 }));
      done();
    });
  });

  it('emits chopTreeFailure on error', (done) => {
    characterApi.chopTree.mockReturnValue(throwError(() => new Error('boom')));
    actions$ = of(CampActions.chopTree({ characterId: 'c1' }));
    setup();

    effects.chopTree$.subscribe((action) => {
      expect(action.type).toBe(CampActions.chopTreeFailure.type);
      done();
    });
  });

  it('emits forageSuccess with the new forage count on success', (done) => {
    characterApi.forage.mockReturnValue(
      of({ id: 'c1', name: 'Ember Scout', createdAt: '2026-01-01', hasArrivedAtCamp: true, campConstructionStage: 0, forageCount: 1 }),
    );
    actions$ = of(CampActions.forage({ characterId: 'c1' }));
    setup();

    effects.forage$.subscribe((action) => {
      expect(characterApi.forage).toHaveBeenCalledWith('c1');
      expect(action).toEqual(CampActions.forageSuccess({ forageCount: 1 }));
      done();
    });
  });

  it('emits forageFailure on error', (done) => {
    characterApi.forage.mockReturnValue(throwError(() => new Error('boom')));
    actions$ = of(CampActions.forage({ characterId: 'c1' }));
    setup();

    effects.forage$.subscribe((action) => {
      expect(action.type).toBe(CampActions.forageFailure.type);
      done();
    });
  });
});
