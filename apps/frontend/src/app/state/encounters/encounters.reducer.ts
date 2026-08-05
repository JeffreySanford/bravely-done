import { createFeature, createReducer, on } from '@ngrx/store';
import { EncounterDto } from '../../api/models/encounter-dto';
import { EncountersActions } from './encounters.actions';

export interface EncountersState {
  /** Every known encounter per quest — a quest can hold several, unlike
   * sprints' single latest slot. */
  byQuestId: Record<string, EncounterDto[] | undefined>;
  loadingQuestId: string | null;
  creatingQuestId: string | null;
  /** The encounter currently being completed — one at a time, same
   * "single in-flight id" pattern used across the other features. */
  transitioningEncounterId: string | null;
  error: string | null;
}

export const initialEncountersState: EncountersState = {
  byQuestId: {},
  loadingQuestId: null,
  creatingQuestId: null,
  transitioningEncounterId: null,
  error: null,
};

export const encountersFeature = createFeature({
  name: 'encounters',
  reducer: createReducer(
    initialEncountersState,

    on(EncountersActions.loadEncounters, (state, { questId }): EncountersState => ({
      ...state,
      loadingQuestId: questId,
      error: null,
    })),
    on(EncountersActions.loadEncountersSuccess, (state, { questId, encounters }): EncountersState => ({
      ...state,
      byQuestId: { ...state.byQuestId, [questId]: encounters },
      loadingQuestId: null,
    })),
    on(EncountersActions.loadEncountersFailure, (state, { error }): EncountersState => ({
      ...state,
      loadingQuestId: null,
      error,
    })),

    on(EncountersActions.createEncounter, (state, { questId }): EncountersState => ({
      ...state,
      creatingQuestId: questId,
      error: null,
    })),
    on(EncountersActions.createEncounterSuccess, (state, { encounter }): EncountersState => ({
      ...state,
      byQuestId: {
        ...state.byQuestId,
        [encounter.questId]: [...(state.byQuestId[encounter.questId] ?? []), encounter],
      },
      creatingQuestId: null,
    })),
    on(EncountersActions.createEncounterFailure, (state, { error }): EncountersState => ({
      ...state,
      creatingQuestId: null,
      error,
    })),

    on(EncountersActions.completeEncounter, (state, { encounterId }): EncountersState => ({
      ...state,
      transitioningEncounterId: encounterId,
      error: null,
    })),
    on(EncountersActions.completeEncounterSuccess, (state, { encounter }): EncountersState => ({
      ...state,
      byQuestId: {
        ...state.byQuestId,
        [encounter.questId]: (state.byQuestId[encounter.questId] ?? []).map((e) =>
          e.id === encounter.id ? encounter : e,
        ),
      },
      transitioningEncounterId: null,
    })),
    on(EncountersActions.completeEncounterFailure, (state, { error }): EncountersState => ({
      ...state,
      transitioningEncounterId: null,
      error,
    })),
  ),
});

export const {
  name: encountersFeatureKey,
  reducer: encountersReducer,
  selectEncountersState,
  selectByQuestId,
  selectCreatingQuestId,
  selectTransitioningEncounterId,
  selectError,
} = encountersFeature;
