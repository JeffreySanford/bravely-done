import { createFeature, createReducer, on } from '@ngrx/store';
import { QuestDto } from '../../api/models/quest-dto';
import { CampActions } from '../camp/camp.actions';
import { EncountersActions } from '../encounters/encounters.actions';
import { SprintsActions } from '../sprints/sprints.actions';
import { QuestsActions } from './quests.actions';

export interface QuestsState {
  characterId: string | null;
  constructionStage: number;
  xp: number;
  coins: number;
  quests: QuestDto[];
  loading: boolean;
  /** The quest currently being started, completed, or retreated from — a
   * quest can only be in one transition at a time, so one field covers
   * all three. */
  resolvingQuestId: string | null;
  error: string | null;
}

export const initialQuestsState: QuestsState = {
  characterId: null,
  constructionStage: 0,
  xp: 0,
  coins: 0,
  quests: [],
  loading: false,
  resolvingQuestId: null,
  error: null,
};

export const questsFeature = createFeature({
  name: 'quests',
  reducer: createReducer(
    initialQuestsState,

    on(QuestsActions.setCharacterContext, (state, { characterId, constructionStage, xp, coins }): QuestsState => ({
      ...initialQuestsState,
      characterId,
      constructionStage,
      xp,
      coins,
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

    on(QuestsActions.startQuest, (state, { questId }): QuestsState => ({
      ...state,
      resolvingQuestId: questId,
      error: null,
    })),
    on(QuestsActions.startQuestSuccess, (state, { quest }): QuestsState => ({
      ...state,
      quests: state.quests.map((q) => (q.id === quest.id ? quest : q)),
      resolvingQuestId: null,
    })),
    on(QuestsActions.startQuestFailure, (state, { error }): QuestsState => ({
      ...state,
      resolvingQuestId: null,
      error,
    })),

    on(QuestsActions.completeQuest, (state, { questId }): QuestsState => ({
      ...state,
      resolvingQuestId: questId,
      error: null,
    })),
    on(QuestsActions.completeQuestSuccess, (state, { quest, constructionStage, xp, coins }): QuestsState => ({
      ...state,
      quests: state.quests.map((q) => (q.id === quest.id ? quest : q)),
      constructionStage,
      xp,
      coins,
      resolvingQuestId: null,
    })),
    on(QuestsActions.completeQuestFailure, (state, { error }): QuestsState => ({
      ...state,
      resolvingQuestId: null,
      error,
    })),

    on(QuestsActions.retreatQuest, (state, { questId }): QuestsState => ({
      ...state,
      resolvingQuestId: questId,
      error: null,
    })),
    on(QuestsActions.retreatQuestSuccess, (state, { quest }): QuestsState => ({
      ...state,
      quests: state.quests.map((q) => (q.id === quest.id ? quest : q)),
      resolvingQuestId: null,
    })),
    on(QuestsActions.retreatQuestFailure, (state, { error }): QuestsState => ({
      ...state,
      resolvingQuestId: null,
      error,
    })),

    // Coins live here (alongside xp) since both are quest-reward currency,
    // but they're also spent by the camp feature's workbench upgrade — the
    // quests reducer listens for that success action too, rather than
    // duplicating a second "coins" value in camp state.
    on(CampActions.upgradeWorkbenchSuccess, (state, { coins }): QuestsState => ({
      ...state,
      coins,
    })),

    // Same cross-feature sync as workbench coins above: Focus XP is
    // granted by the sprints feature (see SprintService.FOCUS_XP_REWARD)
    // but adds to the same Character.xp counter Quest XP does — the
    // quests reducer is xp's single source of truth on the frontend too.
    on(SprintsActions.completeSprintSuccess, (state, { xp }): QuestsState => ({
      ...state,
      xp,
    })),

    // Same cross-feature sync again: Courage XP is granted by the
    // encounters feature (see EncounterService.COURAGE_XP_REWARD) but adds
    // to the same Character.xp counter.
    on(EncountersActions.completeEncounterSuccess, (state, { xp }): QuestsState => ({
      ...state,
      xp,
    })),
  ),
});

export const {
  name: questsFeatureKey,
  reducer: questsReducer,
  selectQuestsState,
  selectCharacterId,
  selectConstructionStage,
  selectXp,
  selectCoins,
  selectQuests,
  selectLoading,
  selectResolvingQuestId,
  selectError,
} = questsFeature;
