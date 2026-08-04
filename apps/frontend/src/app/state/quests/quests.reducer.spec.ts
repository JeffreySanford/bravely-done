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

    const state = questsFeature.reducer(dirty, QuestsActions.setCharacterContext({ characterId: 'c1', constructionStage: 2 }));

    expect(state).toEqual({ ...initialQuestsState, characterId: 'c1', constructionStage: 2 });
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

  it('completeQuest tracks which quest is completing and clears any prior error', () => {
    const state = questsFeature.reducer(
      { ...initialQuestsState, error: 'boom' },
      QuestsActions.completeQuest({ questId: 'q1' }),
    );

    expect(state.completingQuestId).toBe('q1');
    expect(state.error).toBeNull();
  });

  it('completeQuestSuccess replaces only the matching quest, updates the construction stage, and clears completingQuestId', () => {
    const otherQuest = { ...quest, id: 'q2', title: 'Forage plants' };
    const completed = { ...quest, status: 'COMPLETED' as const };
    const state = questsFeature.reducer(
      { ...initialQuestsState, quests: [quest, otherQuest], completingQuestId: 'q1' },
      QuestsActions.completeQuestSuccess({ quest: completed, constructionStage: 1 }),
    );

    expect(state.quests).toEqual([completed, otherQuest]);
    expect(state.constructionStage).toBe(1);
    expect(state.completingQuestId).toBeNull();
  });

  it('completeQuestFailure stores the error and clears completingQuestId', () => {
    const state = questsFeature.reducer(
      { ...initialQuestsState, completingQuestId: 'q1' },
      QuestsActions.completeQuestFailure({ error: 'boom' }),
    );

    expect(state.error).toBe('boom');
    expect(state.completingQuestId).toBeNull();
  });
});
