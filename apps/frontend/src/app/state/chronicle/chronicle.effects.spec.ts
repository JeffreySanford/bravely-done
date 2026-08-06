import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { ChronicleApiService } from '../../core/chronicle-api.service';
import { ChronicleActions } from './chronicle.actions';
import { ChronicleEffects } from './chronicle.effects';

const chronicle = {
  characterId: 'c1',
  from: '2026-07-31T00:00:00.000Z',
  to: '2026-08-06T12:00:00.000Z',
  days: 7,
  questsCompleted: 1,
  questsSplit: 0,
  questsRetreated: 0,
  questsContinued: 0,
  sprintsCompleted: 0,
  focusMinutes: 0,
  encountersCompleted: 0,
  entries: [],
};

describe('ChronicleEffects', () => {
  let actions$: Observable<unknown>;
  let effects: ChronicleEffects;
  let chronicleApi: jest.Mocked<Pick<ChronicleApiService, 'forCharacter'>>;

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        ChronicleEffects,
        provideMockActions(() => actions$),
        { provide: ChronicleApiService, useValue: chronicleApi },
      ],
    });
    effects = TestBed.inject(ChronicleEffects);
  }

  beforeEach(() => {
    chronicleApi = { forCharacter: jest.fn() };
  });

  it('emits loadChronicleSuccess on success', (done) => {
    chronicleApi.forCharacter.mockReturnValue(of(chronicle));
    actions$ = of(ChronicleActions.loadChronicle({ characterId: 'c1' }));
    setup();

    effects.loadChronicle$.subscribe((action) => {
      expect(chronicleApi.forCharacter).toHaveBeenCalledWith('c1');
      expect(action).toEqual(
        ChronicleActions.loadChronicleSuccess({ chronicle }),
      );
      done();
    });
  });

  it('emits loadChronicleFailure on error', (done) => {
    chronicleApi.forCharacter.mockReturnValue(
      throwError(() => new Error('boom')),
    );
    actions$ = of(ChronicleActions.loadChronicle({ characterId: 'c1' }));
    setup();

    effects.loadChronicle$.subscribe((action) => {
      expect(action.type).toBe(ChronicleActions.loadChronicleFailure.type);
      done();
    });
  });
});
