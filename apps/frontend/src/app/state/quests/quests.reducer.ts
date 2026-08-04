import { createFeature, createReducer, on } from '@ngrx/store';
import { QuestDto } from '../../api/models/quest-dto';
import { QuestsActions } from './quests.actions';

export interface QuestsState {
  characterId: string | null;
  constructionStage: number;
  quests: QuestDto[];
  loading: boolean;
  completingQuestId: string | null;
  error: string | null;
}

export const initialQuestsState: QuestsState = {
  characterId: null,
  constructionStage: 0,
  quests: [],
  loading: false,
  completingQuestId: null,
  error: null,
};

export const questsFeature = createFeature({
  name: 'quests',
  reducer: createReducer(
    initialQuestsState,

    on(QuestsActions.setCharacterContext, (state, { characterId, constructionStage }): QuestsState => ({
      ...initialQuestsState,
      characterId,
      constructionStage,
    })),

    on(QuestsActions.loadQuests, (state): QuestsState => ({ ...state, loading: true, error: null })),
    on(QuestsActions.loadQuestsSuccess, (state, { quests }): QuestsState => ({ ...state, quests, loading: false })),
    on(QuestsActions.loadQuestsFailure, (state, { error }): QuestsState => ({ ...state, loading: false, error })),

    on(QuestsActions.createQuest, (state): QuestsState => ({ ...state, loading: true, error: null })),
    on(QuestsActions.createQuestSuccess, (state, { quest }): QuestsState => ({
      ...state,
      quests: [...state.quests, quest],
      loading: false,
    })),
    on(QuestsActions.createQuestFailure, (state, { error }): QuestsState => ({ ...state, loading: false, error })),

    on(QuestsActions.completeQuest, (state, { questId }): QuestsState => ({
      ...state,
      completingQuestId: questId,
      error: null,
    })),
    on(QuestsActions.completeQuestSuccess, (state, { quest, constructionStage }): QuestsState => ({
      ...state,
      quests: state.quests.map((q) => (q.id === quest.id ? quest : q)),
      constructionStage,
      completingQuestId: null,
    })),
    on(QuestsActions.completeQuestFailure, (state, { error }): QuestsState => ({
      ...state,
      completingQuestId: null,
      error,
    })),
  ),
});

export const {
  name: questsFeatureKey,
  reducer: questsReducer,
  selectQuestsState,
  selectCharacterId,
  selectConstructionStage,
  selectQuests,
  selectLoading,
  selectCompletingQuestId,
  selectError,
} = questsFeature;
