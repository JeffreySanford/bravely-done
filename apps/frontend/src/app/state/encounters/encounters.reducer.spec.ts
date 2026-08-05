import { EncountersActions } from './encounters.actions';
import { encountersFeature, initialEncountersState } from './encounters.reducer';

const encounter = {
  id: 'enc-1',
  questId: 'q1',
  title: 'Draft the reply',
  status: 'OPEN' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  completedAt: null,
};

describe('encountersFeature reducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = encountersFeature.reducer(undefined, { type: '@@init' });
    expect(state).toEqual(initialEncountersState);
  });

  it('loadEncounters tracks which quest is loading and clears any prior error', () => {
    const state = encountersFeature.reducer(
      { ...initialEncountersState, error: 'boom' },
      EncountersActions.loadEncounters({ questId: 'q1' }),
    );

    expect(state.loadingQuestId).toBe('q1');
    expect(state.error).toBeNull();
  });

  it('loadEncountersSuccess stores the full list for that quest and clears loading', () => {
    const state = encountersFeature.reducer(
      { ...initialEncountersState, loadingQuestId: 'q1' },
      EncountersActions.loadEncountersSuccess({ questId: 'q1', encounters: [encounter] }),
    );

    expect(state.byQuestId['q1']).toEqual([encounter]);
    expect(state.loadingQuestId).toBeNull();
  });

  it('loadEncountersFailure stores the error and clears loading', () => {
    const state = encountersFeature.reducer(
      { ...initialEncountersState, loadingQuestId: 'q1' },
      EncountersActions.loadEncountersFailure({ questId: 'q1', error: 'boom' }),
    );

    expect(state.error).toBe('boom');
    expect(state.loadingQuestId).toBeNull();
  });

  it('createEncounter tracks which quest is creating and clears any prior error', () => {
    const state = encountersFeature.reducer(
      { ...initialEncountersState, error: 'boom' },
      EncountersActions.createEncounter({ questId: 'q1', title: 'Draft the reply' }),
    );

    expect(state.creatingQuestId).toBe('q1');
    expect(state.error).toBeNull();
  });

  it('createEncounterSuccess appends the encounter to that quest and clears creating', () => {
    const state = encountersFeature.reducer(
      { ...initialEncountersState, byQuestId: { q1: [encounter] }, creatingQuestId: 'q1' },
      EncountersActions.createEncounterSuccess({ encounter: { ...encounter, id: 'enc-2' } }),
    );

    expect(state.byQuestId['q1']).toEqual([encounter, { ...encounter, id: 'enc-2' }]);
    expect(state.creatingQuestId).toBeNull();
  });

  it('createEncounterSuccess initializes the list for a quest with no prior encounters', () => {
    const state = encountersFeature.reducer(
      { ...initialEncountersState, creatingQuestId: 'q1' },
      EncountersActions.createEncounterSuccess({ encounter }),
    );

    expect(state.byQuestId['q1']).toEqual([encounter]);
  });

  it('createEncounterFailure stores the error and clears creating', () => {
    const state = encountersFeature.reducer(
      { ...initialEncountersState, creatingQuestId: 'q1' },
      EncountersActions.createEncounterFailure({ questId: 'q1', error: 'boom' }),
    );

    expect(state.error).toBe('boom');
    expect(state.creatingQuestId).toBeNull();
  });

  it('completeEncounter tracks which encounter is transitioning and clears any prior error', () => {
    const state = encountersFeature.reducer(
      { ...initialEncountersState, error: 'boom' },
      EncountersActions.completeEncounter({ encounterId: 'enc-1' }),
    );

    expect(state.transitioningEncounterId).toBe('enc-1');
    expect(state.error).toBeNull();
  });

  it('completeEncounterSuccess replaces only the matching encounter and clears transitioning', () => {
    const other = { ...encounter, id: 'enc-2', title: 'Second step' };
    const completed = { ...encounter, status: 'COMPLETED' as const, completedAt: '2026-01-01T00:05:00.000Z' };
    const state = encountersFeature.reducer(
      {
        ...initialEncountersState,
        byQuestId: { q1: [encounter, other] },
        transitioningEncounterId: 'enc-1',
      },
      EncountersActions.completeEncounterSuccess({ encounter: completed, xp: 5 }),
    );

    expect(state.byQuestId['q1']).toEqual([completed, other]);
    expect(state.transitioningEncounterId).toBeNull();
  });

  it('completeEncounterFailure stores the error and clears transitioning', () => {
    const state = encountersFeature.reducer(
      { ...initialEncountersState, transitioningEncounterId: 'enc-1' },
      EncountersActions.completeEncounterFailure({ error: 'boom' }),
    );

    expect(state.error).toBe('boom');
    expect(state.transitioningEncounterId).toBeNull();
  });
});
