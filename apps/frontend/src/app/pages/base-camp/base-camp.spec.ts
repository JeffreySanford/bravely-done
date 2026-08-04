import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { of } from 'rxjs';
import { BaseCamp } from './base-camp';
import { CharacterApiService } from '../../core/character-api.service';
import { QuestApiService } from '../../core/quest-api.service';
import { QuestsEffects } from '../../state/quests/quests.effects';
import { questsFeature } from '../../state/quests/quests.reducer';

function buildCharacter(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    name: 'Ember Scout',
    createdAt: '2026-01-01',
    hasArrivedAtCamp: true,
    campConstructionStage: 0,
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
        provideStore({ [questsFeature.name]: questsFeature.reducer }),
        provideEffects(QuestsEffects),
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

  describe('completeQuest', () => {
    it('dispatches completeQuest and updates the construction stage', () => {
      const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
      const complete = jest.fn().mockReturnValue(
        of({
          quest: { id: 'q1', characterId: 'c1', title: 'Chop wood', status: 'COMPLETED', createdAt: '2026-01-01', completedAt: '2026-01-02' },
          character: buildCharacter({ campConstructionStage: 1 }),
        }),
      );
      const { component } = setup({ arrive }, { complete });
      component.ngOnInit();

      component.completeQuest('q1');

      expect(complete).toHaveBeenCalledWith('q1');
      expect(component.constructionStage()).toBe(1);
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
});
