import { createFeature, createReducer, on } from '@ngrx/store';
import { ChronicleDto } from '../../api/models/chronicle-dto';
import { ChronicleActions } from './chronicle.actions';

export interface ChronicleState {
  chronicle: ChronicleDto | null;
  loading: boolean;
  error: string | null;
}

export const initialChronicleState: ChronicleState = {
  chronicle: null,
  loading: false,
  error: null,
};

export const chronicleFeature = createFeature({
  name: 'chronicle',
  reducer: createReducer(
    initialChronicleState,

    on(ChronicleActions.loadChronicle, (state): ChronicleState => ({
      ...state,
      loading: true,
      error: null,
    })),
    // Clears any previous error on success, so a recovered load doesn't
    // leave a stale failure message sitting under real data.
    on(
      ChronicleActions.loadChronicleSuccess,
      (state, { chronicle }): ChronicleState => ({
        ...state,
        chronicle,
        loading: false,
        error: null,
      }),
    ),
    // Deliberately keeps the previously loaded chronicle: a failed refresh
    // should not blank out a summary the player was already reading.
    on(
      ChronicleActions.loadChronicleFailure,
      (state, { error }): ChronicleState => ({
        ...state,
        loading: false,
        error,
      }),
    ),
  ),
});

export const {
  name: chronicleFeatureKey,
  reducer: chronicleReducer,
  selectChronicle,
  selectLoading,
  selectError,
} = chronicleFeature;
