import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore, Store } from '@ngrx/store';
import { of } from 'rxjs';
import { BaseCamp } from './base-camp';
import { CharacterApiService } from '../../core/character-api.service';
import { QuestApiService } from '../../core/quest-api.service';
import { CampActions } from '../../state/camp/camp.actions';
import { CampEffects } from '../../state/camp/camp.effects';
import { campFeature } from '../../state/camp/camp.reducer';
import { QuestsEffects } from '../../state/quests/quests.effects';
import { questsFeature } from '../../state/quests/quests.reducer';
import { SprintsActions } from '../../state/sprints/sprints.actions';
import { sprintsFeature } from '../../state/sprints/sprints.reducer';
import { EncountersActions } from '../../state/encounters/encounters.actions';
import { encountersFeature } from '../../state/encounters/encounters.reducer';

function buildCharacter(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    name: 'Ember Scout',
    createdAt: '2026-01-01',
    hasArrivedAtCamp: true,
    campConstructionStage: 0,
    firewoodCount: 0,
    forageCount: 0,
    xp: 0,
    coins: 0,
    workbenchLevel: 0,
    ...overrides,
  };
}

describe('BaseCamp', () => {
  function setup(
    characterApi: Partial<CharacterApiService>,
    questApi: Partial<QuestApiService> = {},
    characterId: string | null = 'c1',
  ) {
    TestBed.configureTestingModule({
      imports: [BaseCamp],
      providers: [
        provideRouter([]),
        provideStore({
          [questsFeature.name]: questsFeature.reducer,
          [campFeature.name]: campFeature.reducer,
          [sprintsFeature.name]: sprintsFeature.reducer,
          [encountersFeature.name]: encountersFeature.reducer,
        }),
        provideEffects(QuestsEffects, CampEffects),
        { provide: CharacterApiService, useValue: characterApi },
        { provide: QuestApiService, useValue: { list: jest.fn().mockReturnValue(of([])), ...questApi } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(characterId ? { characterId } : {}) } },
        },
      ],
    });
    const fixture = TestBed.createComponent(BaseCamp);
    return { fixture, component: fixture.componentInstance };
  }

  it('marks the character arrived and reflects its name and construction stage', () => {
    const arrive = jest
      .fn()
      .mockReturnValue(of({ firstArrival: true, character: buildCharacter({ campConstructionStage: 1 }) }));
    const { component } = setup({ arrive });

    component.ngOnInit();

    expect(arrive).toHaveBeenCalledWith('c1');
    expect(component.characterName()).toBe('Ember Scout');
    expect(component.constructionStage()).toBe(1);
  });

  it('loads quests for the character once arrived', () => {
    const arrive = jest.fn().mockReturnValue(of({ firstArrival: true, character: buildCharacter() }));
    const list = jest.fn().mockReturnValue(of([{ id: 'q1', characterId: 'c1', title: 'Chop wood', status: 'OPEN', createdAt: '2026-01-01', completedAt: null }]));
    const { component } = setup({ arrive }, { list });

    component.ngOnInit();

    expect(list).toHaveBeenCalledWith('c1');
    expect(component.quests()).toEqual([
      { id: 'q1', characterId: 'c1', title: 'Chop wood', status: 'OPEN', createdAt: '2026-01-01', completedAt: null },
    ]);
  });

  it('seeds firewood count from the arrive response', () => {
    const arrive = jest
      .fn()
      .mockReturnValue(of({ firstArrival: true, character: buildCharacter({ firewoodCount: 4 }) }));
    const { component } = setup({ arrive });

    component.ngOnInit();

    expect(component.firewoodCount()).toBe(4);
  });

  it('seeds forage count from the arrive response', () => {
    const arrive = jest
      .fn()
      .mockReturnValue(of({ firstArrival: true, character: buildCharacter({ forageCount: 2 }) }));
    const { component } = setup({ arrive });

    component.ngOnInit();

    expect(component.forageCount()).toBe(2);
  });

  it('seeds xp, coins, and level from the arrive response', () => {
    const arrive = jest.fn().mockReturnValue(of({ firstArrival: true, character: buildCharacter({ xp: 250, coins: 30 }) }));
    const { component } = setup({ arrive });

    component.ngOnInit();

    expect(component.xp()).toBe(250);
    expect(component.coins()).toBe(30);
    expect(component.level()).toBe(3);
  });

  it('seeds workbench level from the arrive response and derives the next upgrade cost', () => {
    const arrive = jest
      .fn()
      .mockReturnValue(of({ firstArrival: true, character: buildCharacter({ workbenchLevel: 1, coins: 15 }) }));
    const { component } = setup({ arrive });

    component.ngOnInit();

    expect(component.workbenchLevel()).toBe(1);
    expect(component.nextWorkbenchCost()).toBe(20);
    expect(component.canAffordWorkbenchUpgrade()).toBe(false);
  });

  it('reports no further upgrade cost once the workbench is maxed', () => {
    const arrive = jest
      .fn()
      .mockReturnValue(of({ firstArrival: true, character: buildCharacter({ workbenchLevel: 3 }) }));
    const { component } = setup({ arrive });

    component.ngOnInit();

    expect(component.nextWorkbenchCost()).toBeNull();
  });

  it('does not call the API when the route has no characterId', () => {
    const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
    const { component } = setup({ arrive }, {}, null);

    component.ngOnInit();

    expect(arrive).not.toHaveBeenCalled();
  });

  it('does not mount a renderer when WebGL is unavailable (e.g. jsdom)', () => {
    const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
    const { component } = setup({ arrive });

    expect(component.renderScene).toBe(false);
    component.ngOnInit();
    expect(() => component.ngAfterViewInit()).not.toThrow();
  });

  it('a chopTreeSuccess dispatched with no scene mounted is a safe no-op', () => {
    const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
    const { component, fixture } = setup({ arrive });
    component.ngOnInit();

    const store = TestBed.inject(Store);
    expect(() => store.dispatch(CampActions.chopTreeSuccess({ firewoodCount: 1 }))).not.toThrow();
    fixture.destroy();
  });

  it('a forageSuccess dispatched with no scene mounted is a safe no-op', () => {
    const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
    const { component, fixture } = setup({ arrive });
    component.ngOnInit();

    const store = TestBed.inject(Store);
    expect(() => store.dispatch(CampActions.forageSuccess({ forageCount: 1 }))).not.toThrow();
    fixture.destroy();
  });

  it('an upgradeWorkbenchSuccess dispatched with no scene mounted is a safe no-op', () => {
    const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
    const { component, fixture } = setup({ arrive });
    component.ngOnInit();

    const store = TestBed.inject(Store);
    expect(() =>
      store.dispatch(CampActions.upgradeWorkbenchSuccess({ workbenchLevel: 1, coins: 0 })),
    ).not.toThrow();
    fixture.destroy();
  });

  describe('upgradeWorkbench', () => {
    it('dispatches CampActions.upgradeWorkbench with the current character id', () => {
      const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
      const { component } = setup({ arrive });
      component.ngOnInit();
      const store = TestBed.inject(Store);
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      component.upgradeWorkbench();

      expect(dispatchSpy).toHaveBeenCalledWith(CampActions.upgradeWorkbench({ characterId: 'c1' }));
    });

    it('is a no-op when no character has arrived yet', () => {
      const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
      const { component } = setup({ arrive }, {}, null);
      const store = TestBed.inject(Store);
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      component.upgradeWorkbench();

      expect(dispatchSpy).not.toHaveBeenCalled();
    });
  });

  it('disposing is a no-op when no renderer was ever mounted', () => {
    const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
    const { component } = setup({ arrive });

    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  describe('createQuest', () => {
    it('dispatches createQuest with the form value and resets the form', () => {
      const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
      const create = jest.fn().mockReturnValue(of({ id: 'q1', characterId: 'c1', title: 'Chop wood', status: 'OPEN', createdAt: '2026-01-01', completedAt: null }));
      const { component } = setup({ arrive }, { create });
      component.ngOnInit();
      component.newQuestForm.setValue({ title: 'Chop wood' });

      component.createQuest();

      expect(create).toHaveBeenCalledWith('c1', { title: 'Chop wood' });
      expect(component.newQuestForm.getRawValue().title).toBe('');
    });

    it('does not dispatch for an invalid form', () => {
      const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
      const create = jest.fn();
      const { component } = setup({ arrive }, { create });
      component.ngOnInit();

      component.createQuest();

      expect(create).not.toHaveBeenCalled();
    });
  });

  describe('startQuest', () => {
    it('dispatches startQuest', () => {
      const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
      const start = jest.fn().mockReturnValue(
        of({ id: 'q1', characterId: 'c1', title: 'Chop wood', status: 'IN_PROGRESS', createdAt: '2026-01-01', completedAt: null }),
      );
      const { component } = setup({ arrive }, { start });
      component.ngOnInit();

      component.startQuest('q1');

      expect(start).toHaveBeenCalledWith('q1');
    });
  });

  describe('board toggle', () => {
    it('starts closed, and toggleBoard/closeBoard flip it as expected', () => {
      const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
      const { component } = setup({ arrive });

      expect(component.boardOpen()).toBe(false);

      component.toggleBoard();
      expect(component.boardOpen()).toBe(true);

      component.toggleBoard();
      expect(component.boardOpen()).toBe(false);

      component.toggleBoard();
      component.closeBoard();
      expect(component.boardOpen()).toBe(false);
    });
  });

  describe('completeQuest', () => {
    it('dispatches completeQuest and updates construction stage, xp, and coins', () => {
      const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
      const complete = jest.fn().mockReturnValue(
        of({
          quest: { id: 'q1', characterId: 'c1', title: 'Chop wood', status: 'COMPLETED', createdAt: '2026-01-01', completedAt: '2026-01-02' },
          character: buildCharacter({ campConstructionStage: 1, xp: 20, coins: 10 }),
        }),
      );
      const { component } = setup({ arrive }, { complete });
      component.ngOnInit();

      component.completeQuest('q1');

      expect(complete).toHaveBeenCalledWith('q1');
      expect(component.constructionStage()).toBe(1);
      expect(component.xp()).toBe(20);
      expect(component.coins()).toBe(10);
    });
  });

  describe('retreatQuest', () => {
    it('dispatches retreatQuest', () => {
      const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
      const retreat = jest.fn().mockReturnValue(
        of({ id: 'q1', characterId: 'c1', title: 'Chop wood', status: 'RETREATED', createdAt: '2026-01-01', completedAt: null }),
      );
      const { component } = setup({ arrive }, { retreat });
      component.ngOnInit();

      component.retreatQuest('q1');

      expect(retreat).toHaveBeenCalledWith('q1');
    });
  });

  it('dispatches a questCompleted event to the scene director when a quest completes (no director mounted is a no-op)', () => {
    const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
    const complete = jest.fn().mockReturnValue(
      of({
        quest: { id: 'q1', characterId: 'c1', title: 'Chop wood', status: 'COMPLETED', createdAt: '2026-01-01', completedAt: '2026-01-02' },
        character: buildCharacter({ campConstructionStage: 1 }),
      }),
    );
    const { component } = setup({ arrive }, { complete });
    component.ngOnInit();

    expect(() => component.completeQuest('q1')).not.toThrow();
  });

  describe('sprints', () => {
    const sprint = {
      id: 's1',
      questId: 'q1',
      targetSeconds: 900,
      startedAt: new Date(Date.now() - 500_000).toISOString(),
      pausedAt: null,
      pausedSeconds: 0,
      status: 'ACTIVE' as const,
      completedAt: null,
      createdAt: new Date().toISOString(),
    };

    it('dispatches loadSprints for each in-progress quest once quests load', () => {
      const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
      const list = jest.fn().mockReturnValue(
        of([{ id: 'q1', characterId: 'c1', title: 'Chop wood', status: 'IN_PROGRESS', createdAt: '2026-01-01', completedAt: null }]),
      );
      const { component } = setup({ arrive }, { list });
      const store = TestBed.inject(Store);
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      component.ngOnInit();

      expect(dispatchSpy).toHaveBeenCalledWith(SprintsActions.loadSprints({ questId: 'q1' }));
    });

    it('sprintFor reflects the sprint stored for that quest', () => {
      const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
      const { component } = setup({ arrive });
      const store = TestBed.inject(Store);

      expect(component.sprintFor('q1')).toBeUndefined();

      store.dispatch(SprintsActions.startSprintSuccess({ sprint }));

      expect(component.sprintFor('q1')).toEqual(sprint);
    });

    it('computes elapsed/remaining seconds from the sprint timestamps, not a client counter', () => {
      const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
      const { component } = setup({ arrive });

      expect(component.elapsedSecondsFor(sprint)).toBeGreaterThanOrEqual(499);
      expect(component.remainingSecondsFor(sprint)).toBeLessThanOrEqual(401);
      expect(component.canCompleteSprint(sprint)).toBe(false);
    });

    it('canCompleteSprint is true once elapsed time reaches the target', () => {
      const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
      const { component } = setup({ arrive });
      const finishedSprint = { ...sprint, startedAt: new Date(Date.now() - 901_000).toISOString() };

      expect(component.canCompleteSprint(finishedSprint)).toBe(true);
    });

    it('dispatches startSprint/pauseSprint/resumeSprint/completeSprint', () => {
      const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
      const { component } = setup({ arrive });
      const store = TestBed.inject(Store);
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      component.startSprint('q1', 900);
      component.pauseSprint('s1');
      component.resumeSprint('s1');
      component.completeSprint('s1');

      expect(dispatchSpy).toHaveBeenCalledWith(SprintsActions.startSprint({ questId: 'q1', targetSeconds: 900 }));
      expect(dispatchSpy).toHaveBeenCalledWith(SprintsActions.pauseSprint({ sprintId: 's1' }));
      expect(dispatchSpy).toHaveBeenCalledWith(SprintsActions.resumeSprint({ sprintId: 's1' }));
      expect(dispatchSpy).toHaveBeenCalledWith(SprintsActions.completeSprint({ sprintId: 's1' }));
    });

    it('anySprintActive reflects whether any tracked sprint is ACTIVE', () => {
      const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
      const { component } = setup({ arrive });
      const store = TestBed.inject(Store);

      expect(component.anySprintActive()).toBe(false);

      store.dispatch(SprintsActions.startSprintSuccess({ sprint }));
      expect(component.anySprintActive()).toBe(true);

      store.dispatch(SprintsActions.pauseSprintSuccess({ sprint: { ...sprint, status: 'PAUSED', pausedAt: new Date().toISOString() } }));
      expect(component.anySprintActive()).toBe(false);
    });
  });

  describe('encounters', () => {
    const encounter = {
      id: 'enc-1',
      questId: 'q1',
      title: 'Draft the reply',
      status: 'OPEN' as const,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    it('dispatches loadEncounters for each open and in-progress quest once quests load', () => {
      const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
      const list = jest.fn().mockReturnValue(
        of([
          { id: 'q1', characterId: 'c1', title: 'Chop wood', status: 'OPEN', createdAt: '2026-01-01', completedAt: null },
          { id: 'q2', characterId: 'c1', title: 'Forage berries', status: 'IN_PROGRESS', createdAt: '2026-01-01', completedAt: null },
          { id: 'q3', characterId: 'c1', title: 'Already done', status: 'COMPLETED', createdAt: '2026-01-01', completedAt: '2026-01-02' },
        ]),
      );
      const { component } = setup({ arrive }, { list });
      const store = TestBed.inject(Store);
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      component.ngOnInit();

      expect(dispatchSpy).toHaveBeenCalledWith(EncountersActions.loadEncounters({ questId: 'q1' }));
      expect(dispatchSpy).toHaveBeenCalledWith(EncountersActions.loadEncounters({ questId: 'q2' }));
      expect(dispatchSpy).not.toHaveBeenCalledWith(EncountersActions.loadEncounters({ questId: 'q3' }));
    });

    it('encountersFor reflects the encounters stored for that quest, defaulting to an empty list', () => {
      const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
      const { component } = setup({ arrive });
      const store = TestBed.inject(Store);

      expect(component.encountersFor('q1')).toEqual([]);

      store.dispatch(EncountersActions.createEncounterSuccess({ encounter }));

      expect(component.encountersFor('q1')).toEqual([encounter]);
    });

    it('addEncounter dispatches createEncounter with a trimmed title, and is a no-op for blank input', () => {
      const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
      const { component } = setup({ arrive });
      const store = TestBed.inject(Store);
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      component.addEncounter('q1', '  Draft the reply  ');
      component.addEncounter('q1', '   ');

      expect(dispatchSpy).toHaveBeenCalledWith(EncountersActions.createEncounter({ questId: 'q1', title: 'Draft the reply' }));
      expect(dispatchSpy).not.toHaveBeenCalledWith(EncountersActions.createEncounter({ questId: 'q1', title: '' }));
    });

    it('completeEncounter dispatches completeEncounter', () => {
      const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
      const { component } = setup({ arrive });
      const store = TestBed.inject(Store);
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      component.completeEncounter('enc-1');

      expect(dispatchSpy).toHaveBeenCalledWith(EncountersActions.completeEncounter({ encounterId: 'enc-1' }));
    });
  });
});
