import { SprintsActions } from './sprints.actions';
import { initialSprintsState, sprintsFeature } from './sprints.reducer';

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

describe('sprintsFeature reducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = sprintsFeature.reducer(undefined, { type: '@@init' });
    expect(state).toEqual(initialSprintsState);
  });

  it('loadSprints tracks which quest is loading and clears any prior error', () => {
    const state = sprintsFeature.reducer(
      { ...initialSprintsState, error: 'boom' },
      SprintsActions.loadSprints({ questId: 'q1' }),
    );

    expect(state.loadingQuestId).toBe('q1');
    expect(state.error).toBeNull();
  });

  it('loadSprintsSuccess stores the latest sprint for that quest and clears loading', () => {
    const older = { ...sprint, id: 's0' };
    const state = sprintsFeature.reducer(
      { ...initialSprintsState, loadingQuestId: 'q1' },
      SprintsActions.loadSprintsSuccess({ questId: 'q1', sprints: [older, sprint] }),
    );

    expect(state.byQuestId['q1']).toEqual(sprint);
    expect(state.loadingQuestId).toBeNull();
  });

  it('loadSprintsSuccess stores undefined for a quest with no sprints yet', () => {
    const state = sprintsFeature.reducer(
      { ...initialSprintsState, loadingQuestId: 'q1' },
      SprintsActions.loadSprintsSuccess({ questId: 'q1', sprints: [] }),
    );

    expect(state.byQuestId['q1']).toBeUndefined();
  });

  it('loadSprintsFailure stores the error and clears loading', () => {
    const state = sprintsFeature.reducer(
      { ...initialSprintsState, loadingQuestId: 'q1' },
      SprintsActions.loadSprintsFailure({ questId: 'q1', error: 'boom' }),
    );

    expect(state.error).toBe('boom');
    expect(state.loadingQuestId).toBeNull();
  });

  it('startSprint tracks which quest is starting and clears any prior error', () => {
    const state = sprintsFeature.reducer(
      { ...initialSprintsState, error: 'boom' },
      SprintsActions.startSprint({ questId: 'q1', targetSeconds: 900 }),
    );

    expect(state.startingQuestId).toBe('q1');
    expect(state.error).toBeNull();
  });

  it('startSprintSuccess stores the sprint and clears startingQuestId', () => {
    const state = sprintsFeature.reducer(
      { ...initialSprintsState, startingQuestId: 'q1' },
      SprintsActions.startSprintSuccess({ sprint }),
    );

    expect(state.byQuestId['q1']).toEqual(sprint);
    expect(state.startingQuestId).toBeNull();
  });

  it('startSprintFailure stores the error and clears startingQuestId', () => {
    const state = sprintsFeature.reducer(
      { ...initialSprintsState, startingQuestId: 'q1' },
      SprintsActions.startSprintFailure({ questId: 'q1', error: 'boom' }),
    );

    expect(state.error).toBe('boom');
    expect(state.startingQuestId).toBeNull();
  });

  it('pauseSprint/pauseSprintSuccess/pauseSprintFailure track transitioningSprintId', () => {
    let state = sprintsFeature.reducer(initialSprintsState, SprintsActions.pauseSprint({ sprintId: 's1' }));
    expect(state.transitioningSprintId).toBe('s1');

    const paused = { ...sprint, status: 'PAUSED' as const, pausedAt: '2026-01-01T00:05:00.000Z' };
    state = sprintsFeature.reducer(state, SprintsActions.pauseSprintSuccess({ sprint: paused }));
    expect(state.byQuestId['q1']).toEqual(paused);
    expect(state.transitioningSprintId).toBeNull();

    state = sprintsFeature.reducer(
      { ...state, transitioningSprintId: 's1' },
      SprintsActions.pauseSprintFailure({ error: 'boom' }),
    );
    expect(state.error).toBe('boom');
    expect(state.transitioningSprintId).toBeNull();
  });

  it('resumeSprint/resumeSprintSuccess/resumeSprintFailure track transitioningSprintId', () => {
    let state = sprintsFeature.reducer(initialSprintsState, SprintsActions.resumeSprint({ sprintId: 's1' }));
    expect(state.transitioningSprintId).toBe('s1');

    state = sprintsFeature.reducer(state, SprintsActions.resumeSprintSuccess({ sprint }));
    expect(state.byQuestId['q1']).toEqual(sprint);
    expect(state.transitioningSprintId).toBeNull();

    state = sprintsFeature.reducer(
      { ...state, transitioningSprintId: 's1' },
      SprintsActions.resumeSprintFailure({ error: 'boom' }),
    );
    expect(state.error).toBe('boom');
    expect(state.transitioningSprintId).toBeNull();
  });

  it('completeSprint/completeSprintSuccess/completeSprintFailure track transitioningSprintId', () => {
    let state = sprintsFeature.reducer(initialSprintsState, SprintsActions.completeSprint({ sprintId: 's1' }));
    expect(state.transitioningSprintId).toBe('s1');

    const completed = { ...sprint, status: 'COMPLETED' as const, completedAt: '2026-01-01T00:15:00.000Z' };
    state = sprintsFeature.reducer(state, SprintsActions.completeSprintSuccess({ sprint: completed, xp: 15 }));
    expect(state.byQuestId['q1']).toEqual(completed);
    expect(state.transitioningSprintId).toBeNull();

    state = sprintsFeature.reducer(
      { ...state, transitioningSprintId: 's1' },
      SprintsActions.completeSprintFailure({ error: 'boom' }),
    );
    expect(state.error).toBe('boom');
    expect(state.transitioningSprintId).toBeNull();
  });
});
