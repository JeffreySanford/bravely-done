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
  /** The quest currently being started, continued, completed, retreated, or
   * split — a quest can only be in one transition at a time, so one field
   * covers all five. */
  resolvingQuestId: string | null;
  error: string | null;
  /** The most recent XP/coin grant, computed as a delta at the moment each
   * reward-bearing success action lands (never in setCharacterContext, so a
   * page load never replays a celebration for XP/coins the player already
   * had). Drives the celebration toast (base-camp.html) — see
   * documentation/product/base-camp.md. Not persisted; a fresh page load
   * starts with this null. `label` is set when the grant included a Daily
   * reward loop bonus (First Brave Step / Today's Three — rewards-
   * retention.md), so the toast can say what actually happened rather than
   * just a bigger number. */
  lastReward: { xpGained: number; coinsGained: number; at: number; label?: string } | null;
  /** The quest currently being designated/undesignated as Today's Three —
   * a lightweight toggle, not a quest resolution, so it gets its own
   * in-flight tracking rather than sharing resolvingQuestId. */
  togglingTodaysThreeQuestId: string | null;
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
  lastReward: null,
  togglingTodaysThreeQuestId: null,
};

/** Human-readable label for the celebration toast when a completion grants
 * one or both of the Daily reward loop's bonuses — undefined for an
 * ordinary completion (the toast just shows the XP/coins total then). */
function dailyBonusLabel(firstBraveStepBonusGranted: boolean, todaysThreeBonusGranted: boolean): string | undefined {
  if (firstBraveStepBonusGranted && todaysThreeBonusGranted) {
    return "First Brave Step + Today's Three bonus!";
  }
  if (firstBraveStepBonusGranted) {
    return 'First Brave Step bonus!';
  }
  if (todaysThreeBonusGranted) {
    return "Today's Three bonus!";
  }
  return undefined;
}

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

    on(QuestsActions.continueQuest, (state, { questId }): QuestsState => ({
      ...state,
      resolvingQuestId: questId,
      error: null,
    })),
    on(QuestsActions.continueQuestSuccess, (state, { quest }): QuestsState => ({
      ...state,
      quests: state.quests.map((q) => (q.id === quest.id ? quest : q)),
      resolvingQuestId: null,
    })),
    on(QuestsActions.continueQuestFailure, (state, { error }): QuestsState => ({
      ...state,
      resolvingQuestId: null,
      error,
    })),

    on(QuestsActions.completeQuest, (state, { questId }): QuestsState => ({
      ...state,
      resolvingQuestId: questId,
      error: null,
    })),
    on(
      QuestsActions.completeQuestSuccess,
      (state, { quest, constructionStage, xp, coins, firstBraveStepBonusGranted, todaysThreeBonusGranted }): QuestsState => ({
        ...state,
        quests: state.quests.map((q) => (q.id === quest.id ? quest : q)),
        constructionStage,
        xp,
        coins,
        resolvingQuestId: null,
        lastReward: {
          xpGained: xp - state.xp,
          coinsGained: coins - state.coins,
          at: Date.now(),
          label: dailyBonusLabel(firstBraveStepBonusGranted, todaysThreeBonusGranted),
        },
      }),
    ),
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

    on(QuestsActions.splitQuest, (state, { questId }): QuestsState => ({
      ...state,
      resolvingQuestId: questId,
      error: null,
    })),
    on(QuestsActions.splitQuestSuccess, (state, { quest, xp, coins }): QuestsState => ({
      ...state,
      quests: state.quests.map((q) => (q.id === quest.id ? quest : q)),
      xp,
      coins,
      resolvingQuestId: null,
      lastReward: { xpGained: xp - state.xp, coinsGained: coins - state.coins, at: Date.now() },
    })),
    on(QuestsActions.splitQuestFailure, (state, { error }): QuestsState => ({
      ...state,
      resolvingQuestId: null,
      error,
    })),

    on(QuestsActions.designateTodaysThree, (state, { questId }): QuestsState => ({
      ...state,
      togglingTodaysThreeQuestId: questId,
      error: null,
    })),
    on(QuestsActions.designateTodaysThreeSuccess, (state, { quest }): QuestsState => ({
      ...state,
      quests: state.quests.map((q) => (q.id === quest.id ? quest : q)),
      togglingTodaysThreeQuestId: null,
    })),
    on(QuestsActions.designateTodaysThreeFailure, (state, { error }): QuestsState => ({
      ...state,
      togglingTodaysThreeQuestId: null,
      error,
    })),

    on(QuestsActions.undesignateTodaysThree, (state, { questId }): QuestsState => ({
      ...state,
      togglingTodaysThreeQuestId: questId,
      error: null,
    })),
    on(QuestsActions.undesignateTodaysThreeSuccess, (state, { quest }): QuestsState => ({
      ...state,
      quests: state.quests.map((q) => (q.id === quest.id ? quest : q)),
      togglingTodaysThreeQuestId: null,
    })),
    on(QuestsActions.undesignateTodaysThreeFailure, (state, { error }): QuestsState => ({
      ...state,
      togglingTodaysThreeQuestId: null,
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
      lastReward: { xpGained: xp - state.xp, coinsGained: 0, at: Date.now() },
    })),

    // Same cross-feature sync again: Courage XP is granted by the
    // encounters feature (see EncounterService.COURAGE_XP_REWARD) but adds
    // to the same Character.xp counter.
    on(EncountersActions.completeEncounterSuccess, (state, { xp }): QuestsState => ({
      ...state,
      xp,
      lastReward: { xpGained: xp - state.xp, coinsGained: 0, at: Date.now() },
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
  selectLastReward,
  selectTogglingTodaysThreeQuestId,
} = questsFeature;
