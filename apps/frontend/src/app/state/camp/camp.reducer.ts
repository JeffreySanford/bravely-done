import { createFeature, createReducer, on } from '@ngrx/store';
import { CampActions } from './camp.actions';

export interface CampState {
  characterId: string | null;
  firewoodCount: number;
  chopping: boolean;
  error: string | null;
}

export const initialCampState: CampState = {
  characterId: null,
  firewoodCount: 0,
  chopping: false,
  error: null,
};

export const campFeature = createFeature({
  name: 'camp',
  reducer: createReducer(
    initialCampState,

    on(CampActions.setCharacterContext, (state, { characterId, firewoodCount }): CampState => ({
      ...initialCampState,
      characterId,
      firewoodCount,
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
  ),
});

export const {
  name: campFeatureKey,
  reducer: campReducer,
  selectCampState,
  selectCharacterId,
  selectFirewoodCount,
  selectChopping,
  selectError,
} = campFeature;
