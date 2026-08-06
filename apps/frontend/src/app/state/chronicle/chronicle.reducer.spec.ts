import { ChronicleActions } from './chronicle.actions';
import { chronicleFeature, initialChronicleState } from './chronicle.reducer';

const chronicle = {
  characterId: 'c1',
  from: '2026-07-31T00:00:00.000Z',
  to: '2026-08-06T12:00:00.000Z',
  days: 7,
  questsCompleted: 2,
  questsSplit: 1,
  questsRetreated: 0,
  questsContinued: 1,
  sprintsCompleted: 1,
  focusMinutes: 15,
  encountersCompleted: 3,
  entries: [],
};

describe('chronicleFeature reducer', () => {
  it('returns the initial state for an unknown action', () => {
    expect(chronicleFeature.reducer(undefined, { type: '@@init' })).toEqual(
      initialChronicleState,
    );
  });

  it('loadChronicle sets loading and clears any prior error', () => {
    const state = chronicleFeature.reducer(
      { ...initialChronicleState, error: 'boom' },
      ChronicleActions.loadChronicle({ characterId: 'c1' }),
    );

    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('loadChronicleSuccess stores the chronicle and clears loading', () => {
    const state = chronicleFeature.reducer(
      { ...initialChronicleState, loading: true },
      ChronicleActions.loadChronicleSuccess({ chronicle }),
    );

    expect(state.chronicle).toEqual(chronicle);
    expect(state.loading).toBe(false);
  });

  it('loadChronicleSuccess clears a previous error so a recovered load reads cleanly', () => {
    const state = chronicleFeature.reducer(
      { ...initialChronicleState, error: 'boom' },
      ChronicleActions.loadChronicleSuccess({ chronicle }),
    );

    expect(state.error).toBeNull();
  });

  it('loadChronicleFailure keeps the chronicle already on screen rather than blanking it', () => {
    const state = chronicleFeature.reducer(
      { ...initialChronicleState, chronicle, loading: true },
      ChronicleActions.loadChronicleFailure({ error: 'boom' }),
    );

    expect(state.error).toBe('boom');
    expect(state.loading).toBe(false);
    expect(state.chronicle).toEqual(chronicle);
  });
});
