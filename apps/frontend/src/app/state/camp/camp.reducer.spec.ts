import { CampActions } from './camp.actions';
import { campFeature, initialCampState } from './camp.reducer';

describe('campFeature reducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = campFeature.reducer(undefined, { type: '@@init' });
    expect(state).toEqual(initialCampState);
  });

  it('setCharacterContext resets to a fresh state for the given character', () => {
    const dirty = campFeature.reducer(initialCampState, CampActions.chopTreeSuccess({ firewoodCount: 5 }));

    const state = campFeature.reducer(
      dirty,
      CampActions.setCharacterContext({ characterId: 'c1', firewoodCount: 2, forageCount: 1 }),
    );

    expect(state).toEqual({ ...initialCampState, characterId: 'c1', firewoodCount: 2, forageCount: 1 });
  });

  it('chopTree sets chopping and clears any prior error', () => {
    const state = campFeature.reducer(
      { ...initialCampState, error: 'boom' },
      CampActions.chopTree({ characterId: 'c1' }),
    );

    expect(state.chopping).toBe(true);
    expect(state.error).toBeNull();
  });

  it('chopTreeSuccess stores the new firewood count and clears chopping', () => {
    const state = campFeature.reducer(
      { ...initialCampState, chopping: true },
      CampActions.chopTreeSuccess({ firewoodCount: 3 }),
    );

    expect(state.firewoodCount).toBe(3);
    expect(state.chopping).toBe(false);
  });

  it('chopTreeFailure stores the error and clears chopping', () => {
    const state = campFeature.reducer(
      { ...initialCampState, chopping: true },
      CampActions.chopTreeFailure({ error: 'boom' }),
    );

    expect(state.error).toBe('boom');
    expect(state.chopping).toBe(false);
  });

  it('forage sets foraging and clears any prior error', () => {
    const state = campFeature.reducer(
      { ...initialCampState, error: 'boom' },
      CampActions.forage({ characterId: 'c1' }),
    );

    expect(state.foraging).toBe(true);
    expect(state.error).toBeNull();
  });

  it('forageSuccess stores the new forage count and clears foraging', () => {
    const state = campFeature.reducer(
      { ...initialCampState, foraging: true },
      CampActions.forageSuccess({ forageCount: 4 }),
    );

    expect(state.forageCount).toBe(4);
    expect(state.foraging).toBe(false);
  });

  it('forageFailure stores the error and clears foraging', () => {
    const state = campFeature.reducer(
      { ...initialCampState, foraging: true },
      CampActions.forageFailure({ error: 'boom' }),
    );

    expect(state.error).toBe('boom');
    expect(state.foraging).toBe(false);
  });
});
