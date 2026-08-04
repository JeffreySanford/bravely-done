import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BaseCamp } from './base-camp';
import { CharacterApiService } from '../../core/character-api.service';

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
  function setup(characterApi: Partial<CharacterApiService>, characterId: string | null = 'c1') {
    TestBed.configureTestingModule({
      imports: [BaseCamp],
      providers: [
        provideRouter([]),
        { provide: CharacterApiService, useValue: characterApi },
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

  it('does not call the API when the route has no characterId', () => {
    const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
    const { component } = setup({ arrive }, null);

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

  describe('completeMockQuest', () => {
    it('advances the construction stage on success', () => {
      const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
      const completeMockQuest = jest.fn().mockReturnValue(of(buildCharacter({ campConstructionStage: 1 })));
      const { component } = setup({ arrive, completeMockQuest });
      component.ngOnInit();

      component.completeMockQuest();

      expect(completeMockQuest).toHaveBeenCalledWith('c1');
      expect(component.constructionStage()).toBe(1);
      expect(component.advancingBridge()).toBe(false);
    });

    it('resets the advancing flag on failure', () => {
      const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
      const completeMockQuest = jest.fn().mockReturnValue(throwError(() => new Error('boom')));
      const { component } = setup({ arrive, completeMockQuest });
      component.ngOnInit();

      component.completeMockQuest();

      expect(component.advancingBridge()).toBe(false);
    });

    it('does nothing without a characterId', () => {
      const arrive = jest.fn().mockReturnValue(of({ firstArrival: false, character: buildCharacter() }));
      const completeMockQuest = jest.fn();
      const { component } = setup({ arrive, completeMockQuest }, null);

      component.completeMockQuest();

      expect(completeMockQuest).not.toHaveBeenCalled();
    });

    it('does nothing once the bridge is already fully repaired', () => {
      const arrive = jest
        .fn()
        .mockReturnValue(of({ firstArrival: false, character: buildCharacter({ campConstructionStage: 3 }) }));
      const completeMockQuest = jest.fn();
      const { component } = setup({ arrive, completeMockQuest });
      component.ngOnInit();

      component.completeMockQuest();

      expect(completeMockQuest).not.toHaveBeenCalled();
    });
  });
});
