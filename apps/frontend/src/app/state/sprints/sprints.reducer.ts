import { createFeature, createReducer, on } from '@ngrx/store';
import { SprintDto } from '../../api/models/sprint-dto';
import { SprintsActions } from './sprints.actions';

export interface SprintsState {
  /** The most recently known sprint per quest — enough to recover a timer
   * across a reload (loadSprints picks the latest) and to render the
   * current sprint on that quest's Kanban card. Completed sprints stay
   * here too (the card can show "sprint done" until a new one starts). */
  byQuestId: Record<string, SprintDto | undefined>;
  loadingQuestId: string | null;
  startingQuestId: string | null;
  /** The sprint currently being paused, resumed, or completed — one at a
   * time, same "single in-flight id" pattern as quests.resolvingQuestId. */
  transitioningSprintId: string | null;
  error: string | null;
}

export const initialSprintsState: SprintsState = {
  byQuestId: {},
  loadingQuestId: null,
  startingQuestId: null,
  transitioningSprintId: null,
  error: null,
};

function latestSprint(sprints: SprintDto[]): SprintDto | undefined {
  return sprints.length > 0 ? sprints[sprints.length - 1] : undefined;
}

export const sprintsFeature = createFeature({
  name: 'sprints',
  reducer: createReducer(
    initialSprintsState,

    on(SprintsActions.loadSprints, (state, { questId }): SprintsState => ({
      ...state,
      loadingQuestId: questId,
      error: null,
    })),
    on(SprintsActions.loadSprintsSuccess, (state, { questId, sprints }): SprintsState => ({
      ...state,
      byQuestId: { ...state.byQuestId, [questId]: latestSprint(sprints) },
      loadingQuestId: null,
    })),
    on(SprintsActions.loadSprintsFailure, (state, { error }): SprintsState => ({
      ...state,
      loadingQuestId: null,
      error,
    })),

    on(SprintsActions.startSprint, (state, { questId }): SprintsState => ({
      ...state,
      startingQuestId: questId,
      error: null,
    })),
    on(SprintsActions.startSprintSuccess, (state, { sprint }): SprintsState => ({
      ...state,
      byQuestId: { ...state.byQuestId, [sprint.questId]: sprint },
      startingQuestId: null,
    })),
    on(SprintsActions.startSprintFailure, (state, { error }): SprintsState => ({
      ...state,
      startingQuestId: null,
      error,
    })),

    on(SprintsActions.pauseSprint, (state, { sprintId }): SprintsState => ({
      ...state,
      transitioningSprintId: sprintId,
      error: null,
    })),
    on(SprintsActions.pauseSprintSuccess, (state, { sprint }): SprintsState => ({
      ...state,
      byQuestId: { ...state.byQuestId, [sprint.questId]: sprint },
      transitioningSprintId: null,
    })),
    on(SprintsActions.pauseSprintFailure, (state, { error }): SprintsState => ({
      ...state,
      transitioningSprintId: null,
      error,
    })),

    on(SprintsActions.resumeSprint, (state, { sprintId }): SprintsState => ({
      ...state,
      transitioningSprintId: sprintId,
      error: null,
    })),
    on(SprintsActions.resumeSprintSuccess, (state, { sprint }): SprintsState => ({
      ...state,
      byQuestId: { ...state.byQuestId, [sprint.questId]: sprint },
      transitioningSprintId: null,
    })),
    on(SprintsActions.resumeSprintFailure, (state, { error }): SprintsState => ({
      ...state,
      transitioningSprintId: null,
      error,
    })),

    on(SprintsActions.completeSprint, (state, { sprintId }): SprintsState => ({
      ...state,
      transitioningSprintId: sprintId,
      error: null,
    })),
    on(SprintsActions.completeSprintSuccess, (state, { sprint }): SprintsState => ({
      ...state,
      byQuestId: { ...state.byQuestId, [sprint.questId]: sprint },
      transitioningSprintId: null,
    })),
    on(SprintsActions.completeSprintFailure, (state, { error }): SprintsState => ({
      ...state,
      transitioningSprintId: null,
      error,
    })),
  ),
});

export const {
  name: sprintsFeatureKey,
  reducer: sprintsReducer,
  selectSprintsState,
  selectByQuestId,
  selectStartingQuestId,
  selectTransitioningSprintId,
  selectError,
} = sprintsFeature;
