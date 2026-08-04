import { createFeature, createReducer, on } from '@ngrx/store';
import { CampActions } from './camp.actions';

export interface CampState {
  characterId: string | null;
  firewoodCount: number;
  forageCount: number;
  chopping: boolean;
  foraging: boolean;
  error: string | null;
}

export const initialCampState: CampState = {
  characterId: null,
  firewoodCount: 0,
  forageCount: 0,
  chopping: false,
  foraging: false,
  error: null,
};

export const campFeature = createFeature({
  name: 'camp',
  reducer: createReducer(
    initialCampState,

    on(CampActions.setCharacterContext, (state, { characterId, firewoodCount, forageCount }): CampState => ({
      ...initialCampState,
      characterId,
      firewoodCount,
      forageCount,
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
  ),
});

export const {
  name: campFeatureKey,
  reducer: campReducer,
  selectCampState,
  selectCharacterId,
  selectFirewoodCount,
  selectForageCount,
  selectChopping,
  selectForaging,
  selectError,
} = campFeature;
