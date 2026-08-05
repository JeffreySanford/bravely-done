import { CampActions } from '../camp/camp.actions';
import { EncountersActions } from '../encounters/encounters.actions';
import { SprintsActions } from '../sprints/sprints.actions';
import { QuestsActions } from './quests.actions';
import { initialQuestsState, questsFeature } from './quests.reducer';

const quest = { id: 'q1', characterId: 'c1', title: 'Chop wood', status: 'OPEN' as const, createdAt: '2026-01-01', completedAt: null };

describe('questsFeature reducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = questsFeature.reducer(undefined, { type: '@@init' });
    expect(state).toEqual(initialQuestsState);
  });

  it('setCharacterContext resets to a fresh state for the given character', () => {
    const dirty = questsFeature.reducer(initialQuestsState, QuestsActions.loadQuestsSuccess({ quests: [quest] }));

    const state = questsFeature.reducer(
      dirty,
      QuestsActions.setCharacterContext({ characterId: 'c1', constructionStage: 2, xp: 40, coins: 20 }),
    );

    expect(state).toEqual({ ...initialQuestsState, characterId: 'c1', constructionStage: 2, xp: 40, coins: 20 });
  });

  it('loadQuests sets loading and clears any prior error', () => {
    const state = questsFeature.reducer(
      { ...initialQuestsState, error: 'boom' },
      QuestsActions.loadQuests({ characterId: 'c1' }),
    );

    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('loadQuestsSuccess stores the quests and clears loading', () => {
    const state = questsFeature.reducer(
      { ...initialQuestsState, loading: true },
      QuestsActions.loadQuestsSuccess({ quests: [quest] }),
    );

    expect(state.quests).toEqual([quest]);
    expect(state.loading).toBe(false);
  });

  it('loadQuestsFailure stores the error and clears loading', () => {
    const state = questsFeature.reducer(
      { ...initialQuestsState, loading: true },
      QuestsActions.loadQuestsFailure({ error: 'boom' }),
    );

    expect(state.error).toBe('boom');
    expect(state.loading).toBe(false);
  });

  it('createQuest sets loading and clears any prior error', () => {
    const state = questsFeature.reducer(
      { ...initialQuestsState, error: 'boom' },
      QuestsActions.createQuest({ characterId: 'c1', title: 'Chop wood' }),
    );

    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('createQuestSuccess appends the quest and clears loading', () => {
    const state = questsFeature.reducer(
      { ...initialQuestsState, loading: true },
      QuestsActions.createQuestSuccess({ quest }),
    );

    expect(state.quests).toEqual([quest]);
    expect(state.loading).toBe(false);
  });

  it('createQuestFailure stores the error and clears loading', () => {
    const state = questsFeature.reducer(
      { ...initialQuestsState, loading: true },
      QuestsActions.createQuestFailure({ error: 'boom' }),
    );

    expect(state.error).toBe('boom');
    expect(state.loading).toBe(false);
  });

  it('startQuest tracks which quest is resolving and clears any prior error', () => {
    const state = questsFeature.reducer(
      { ...initialQuestsState, error: 'boom' },
      QuestsActions.startQuest({ questId: 'q1' }),
    );

    expect(state.resolvingQuestId).toBe('q1');
    expect(state.error).toBeNull();
  });

  it('startQuestSuccess replaces only the matching quest and clears resolvingQuestId', () => {
    const otherQuest = { ...quest, id: 'q2', title: 'Forage plants' };
    const started = { ...quest, status: 'IN_PROGRESS' as const };
    const state = questsFeature.reducer(
      { ...initialQuestsState, quests: [quest, otherQuest], resolvingQuestId: 'q1' },
      QuestsActions.startQuestSuccess({ quest: started }),
    );

    expect(state.quests).toEqual([started, otherQuest]);
    expect(state.resolvingQuestId).toBeNull();
  });

  it('startQuestFailure stores the error and clears resolvingQuestId', () => {
    const state = questsFeature.reducer(
      { ...initialQuestsState, resolvingQuestId: 'q1' },
      QuestsActions.startQuestFailure({ error: 'boom' }),
    );

    expect(state.error).toBe('boom');
    expect(state.resolvingQuestId).toBeNull();
  });

  it('completeQuest tracks which quest is resolving and clears any prior error', () => {
    const state = questsFeature.reducer(
      { ...initialQuestsState, error: 'boom' },
      QuestsActions.completeQuest({ questId: 'q1' }),
    );

    expect(state.resolvingQuestId).toBe('q1');
    expect(state.error).toBeNull();
  });

  it('completeQuestSuccess replaces only the matching quest, updates construction stage/xp/coins, and clears resolvingQuestId', () => {
    const otherQuest = { ...quest, id: 'q2', title: 'Forage plants' };
    const completed = { ...quest, status: 'COMPLETED' as const };
    const state = questsFeature.reducer(
      { ...initialQuestsState, quests: [quest, otherQuest], resolvingQuestId: 'q1' },
      QuestsActions.completeQuestSuccess({ quest: completed, constructionStage: 1, xp: 20, coins: 10 }),
    );

    expect(state.quests).toEqual([completed, otherQuest]);
    expect(state.constructionStage).toBe(1);
    expect(state.xp).toBe(20);
    expect(state.coins).toBe(10);
    expect(state.resolvingQuestId).toBeNull();
  });

  it('completeQuestFailure stores the error and clears resolvingQuestId', () => {
    const state = questsFeature.reducer(
      { ...initialQuestsState, resolvingQuestId: 'q1' },
      QuestsActions.completeQuestFailure({ error: 'boom' }),
    );

    expect(state.error).toBe('boom');
    expect(state.resolvingQuestId).toBeNull();
  });

  it('retreatQuest tracks which quest is resolving and clears any prior error', () => {
    const state = questsFeature.reducer(
      { ...initialQuestsState, error: 'boom' },
      QuestsActions.retreatQuest({ questId: 'q1' }),
    );

    expect(state.resolvingQuestId).toBe('q1');
    expect(state.error).toBeNull();
  });

  it('retreatQuestSuccess replaces only the matching quest and clears resolvingQuestId', () => {
    const otherQuest = { ...quest, id: 'q2', title: 'Forage plants' };
    const retreated = { ...quest, status: 'RETREATED' as const };
    const state = questsFeature.reducer(
      { ...initialQuestsState, quests: [quest, otherQuest], resolvingQuestId: 'q1' },
      QuestsActions.retreatQuestSuccess({ quest: retreated }),
    );

    expect(state.quests).toEqual([retreated, otherQuest]);
    expect(state.resolvingQuestId).toBeNull();
  });

  it('retreatQuestFailure stores the error and clears resolvingQuestId', () => {
    const state = questsFeature.reducer(
      { ...initialQuestsState, resolvingQuestId: 'q1' },
      QuestsActions.retreatQuestFailure({ error: 'boom' }),
    );

    expect(state.error).toBe('boom');
    expect(state.resolvingQuestId).toBeNull();
  });

  it('syncs coins when the camp feature reports a successful workbench upgrade', () => {
    const state = questsFeature.reducer(
      { ...initialQuestsState, coins: 30 },
      CampActions.upgradeWorkbenchSuccess({ workbenchLevel: 1, coins: 20 }),
    );

    expect(state.coins).toBe(20);
  });

  it('syncs xp when the sprints feature reports a successful sprint completion', () => {
    const sprint = {
      id: 's1',
      questId: 'q1',
      targetSeconds: 900,
      startedAt: '2026-01-01T00:00:00.000Z',
      pausedAt: null,
      pausedSeconds: 0,
      status: 'COMPLETED' as const,
      completedAt: '2026-01-01T00:15:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    const state = questsFeature.reducer(
      { ...initialQuestsState, xp: 20 },
      SprintsActions.completeSprintSuccess({ sprint, xp: 35 }),
    );

    expect(state.xp).toBe(35);
  });

  it('syncs xp when the encounters feature reports a successful encounter completion', () => {
    const encounter = {
      id: 'enc-1',
      questId: 'q1',
      title: 'Draft the reply',
      status: 'COMPLETED' as const,
      createdAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:05:00.000Z',
    };
    const state = questsFeature.reducer(
      { ...initialQuestsState, xp: 20 },
      EncountersActions.completeEncounterSuccess({ encounter, xp: 25 }),
    );

    expect(state.xp).toBe(25);
  });
});
