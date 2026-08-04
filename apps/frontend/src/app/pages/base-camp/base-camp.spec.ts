import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { BaseCamp } from './base-camp';
import { CharacterApiService } from '../../core/character-api.service';

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

  it('resolves the arriving character by id from the route', () => {
    const list = jest
      .fn()
      .mockReturnValue(of([{ id: 'c1', name: 'Ember Scout', createdAt: '2026-01-01' }]));
    const { component } = setup({ list });

    component.ngOnInit();

    expect(list).toHaveBeenCalled();
    expect(component.characterName()).toBe('Ember Scout');
  });

  it('leaves the character name unset when no character matches the route id', () => {
    const list = jest.fn().mockReturnValue(of([]));
    const { component } = setup({ list });

    component.ngOnInit();

    expect(component.characterName()).toBeNull();
  });

  it('does not call the API when the route has no characterId', () => {
    const list = jest.fn().mockReturnValue(of([]));
    const { component } = setup({ list }, null);

    component.ngOnInit();

    expect(list).not.toHaveBeenCalled();
  });

  it('does not mount a renderer when WebGL is unavailable (e.g. jsdom)', () => {
    const list = jest.fn().mockReturnValue(of([]));
    const { component } = setup({ list });

    expect(component.renderScene).toBe(false);
    expect(() => component.ngAfterViewInit()).not.toThrow();
  });

  it('disposing is a no-op when no renderer was ever mounted', () => {
    const list = jest.fn().mockReturnValue(of([]));
    const { component } = setup({ list });

    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
