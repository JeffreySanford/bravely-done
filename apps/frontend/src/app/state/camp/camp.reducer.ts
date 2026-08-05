import { createFeature, createReducer, on } from '@ngrx/store';
import { CampActions } from './camp.actions';

export interface CampState {
  characterId: string | null;
  firewoodCount: number;
  forageCount: number;
  workbenchLevel: number;
  chopping: boolean;
  foraging: boolean;
  upgradingWorkbench: boolean;
  error: string | null;
}

export const initialCampState: CampState = {
  characterId: null,
  firewoodCount: 0,
  forageCount: 0,
  workbenchLevel: 0,
  chopping: false,
  foraging: false,
  upgradingWorkbench: false,
  error: null,
};

export const campFeature = createFeature({
  name: 'camp',
  reducer: createReducer(
    initialCampState,

    on(CampActions.setCharacterContext, (state, { characterId, firewoodCount, forageCount, workbenchLevel }): CampState => ({
      ...initialCampState,
      characterId,
      firewoodCount,
      forageCount,
      workbenchLevel,
    })),

    on(CampActions.chopTree, (state): CampState => ({ ...state, chopping: true, error: null })),
    on(CampActions.chopTreeSuccess, (state, { firewoodCount }): CampState => ({
      ...state,
      firewoodCount,
      chopping: false,
    })),
    on(CampActions.chopTreeFailure, (state, { error }): CampState => ({
      ...state,
      chopping: false,
      error,
    })),

    on(CampActions.forage, (state): CampState => ({ ...state, foraging: true, error: null })),
    on(CampActions.forageSuccess, (state, { forageCount }): CampState => ({
      ...state,
      forageCount,
      foraging: false,
    })),
    on(CampActions.forageFailure, (state, { error }): CampState => ({
      ...state,
      foraging: false,
      error,
    })),

    on(CampActions.upgradeWorkbench, (state): CampState => ({ ...state, upgradingWorkbench: true, error: null })),
    on(CampActions.upgradeWorkbenchSuccess, (state, { workbenchLevel }): CampState => ({
      ...state,
      workbenchLevel,
      upgradingWorkbench: false,
    })),
    on(CampActions.upgradeWorkbenchFailure, (state, { error }): CampState => ({
      ...state,
      upgradingWorkbench: false,
      error,
    })),
  ),
});

export const {
  name: campFeatureKey,
  reducer: campReducer,
  selectCampState,
  selectCharacterId,
  selectFirewoodCount,
  selectForageCount,
  selectWorkbenchLevel,
  selectChopping,
  selectForaging,
  selectUpgradingWorkbench,
  selectError,
} = campFeature;
