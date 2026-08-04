import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { of } from 'rxjs';
import { CharacterApiService } from '../../core/character-api.service';
import { QuestApiService } from '../../core/quest-api.service';
import { AnimationDirector } from '../../game-rendering/animation-director';
import { CampEffects } from '../../state/camp/camp.effects';
import { campFeature } from '../../state/camp/camp.reducer';
import { QuestsEffects } from '../../state/quests/quests.effects';
import { questsFeature } from '../../state/quests/quests.reducer';
import type { BaseCampSceneOptions } from './base-camp-scene';

// Module-level mocks so `isWebglAvailable()` (evaluated at class-field
// initialization time) reports true here, letting us verify the renderer
// wiring itself — without needing a real WebGL context, which this file's
// sibling spec (base-camp.spec.ts) correctly can't provide via jsdom.
jest.mock('../../game-rendering/webgl-support', () => ({
  isWebglAvailable: () => true,
}));

const mockStart = jest.fn();
const mockDispose = jest.fn();
jest.mock('../../game-rendering/renderer-lifecycle', () => ({
  RendererLifecycle: jest.fn().mockImplementation(() => ({
    start: mockStart,
    dispose: mockDispose,
  })),
}));

// Also mock the scene builder itself (rather than letting the real,
// WebGL-dependent implementation run) so this spec can inspect exactly
// what options.ts passes in (initialFirewoodCount, onChopTree) and drive
// the returned director directly — real Three.js scene-graph construction
// is covered by base-camp-scene.ts's own OPEN-004 exception and the
// Playwright e2e suite instead.
let lastSceneOptions: BaseCampSceneOptions | undefined;
const mockDirector = new AnimationDirector();
jest.mock('./base-camp-scene', () => ({
  buildBaseCampScene: jest.fn((_motionMode: unknown, options: BaseCampSceneOptions) => {
    lastSceneOptions = options;
    return { handlers: {}, director: mockDirector };
  }),
}));

const { BaseCamp } = require('./base-camp');
const { RendererLifecycle } = require('../../game-rendering/renderer-lifecycle');

describe('BaseCamp (WebGL available)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lastSceneOptions = undefined;
    TestBed.configureTestingModule({
      imports: [BaseCamp],
      providers: [
        provideRouter([]),
        provideStore({
          [questsFeature.name]: questsFeature.reducer,
          [campFeature.name]: campFeature.reducer,
        }),
        provideEffects(QuestsEffects, CampEffects),
        {
          provide: CharacterApiService,
          useValue: {
            arrive: jest.fn().mockReturnValue(
              of({
                firstArrival: true,
                character: { id: 'c1', name: 'Ember Scout', createdAt: '2026-01-01', hasArrivedAtCamp: true, campConstructionStage: 0, firewoodCount: 2, forageCount: 1 },
              }),
            ),
            chopTree: jest.fn().mockReturnValue(
              of({ id: 'c1', name: 'Ember Scout', createdAt: '2026-01-01', hasArrivedAtCamp: true, campConstructionStage: 0, firewoodCount: 3, forageCount: 1 }),
            ),
            forage: jest.fn().mockReturnValue(
              of({ id: 'c1', name: 'Ember Scout', createdAt: '2026-01-01', hasArrivedAtCamp: true, campConstructionStage: 0, firewoodCount: 2, forageCount: 2 }),
            ),
          },
        },
        {
          provide: QuestApiService,
          useValue: {
            list: jest.fn().mockReturnValue(of([])),
            complete: jest.fn().mockReturnValue(
              of({
                quest: { id: 'q1', characterId: 'c1', title: 'Chop wood', status: 'COMPLETED', createdAt: '2026-01-01', completedAt: '2026-01-02' },
                character: { id: 'c1', name: 'Ember Scout', createdAt: '2026-01-01', hasArrivedAtCamp: true, campConstructionStage: 1, firewoodCount: 2 },
              }),
            ),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ characterId: 'c1' }) } },
        },
      ],
    });
  });

  it('mounts a RendererLifecycle and starts it once the canvas is in the view', () => {
    const fixture = TestBed.createComponent(BaseCamp);

    fixture.detectChanges(); // runs ngOnInit + ngAfterViewInit via Angular's real lifecycle

    expect(RendererLifecycle).toHaveBeenCalledTimes(1);
    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it('disposes the renderer on destroy', () => {
    const fixture = TestBed.createComponent(BaseCamp);
    fixture.detectChanges();

    fixture.destroy();

    expect(mockDispose).toHaveBeenCalledTimes(1);
  });

  it('passes the current firewood and forage counts into the scene', () => {
    const fixture = TestBed.createComponent(BaseCamp);
    fixture.detectChanges();

    expect(lastSceneOptions?.initialFirewoodCount).toBe(2);
    expect(lastSceneOptions?.initialForageCount).toBe(1);
  });

  it('dispatches chopTree when the scene reports a chop, and firewoodGathered back once it succeeds', () => {
    const dispatchSpy = jest.spyOn(mockDirector, 'dispatch');
    const fixture = TestBed.createComponent(BaseCamp);
    fixture.detectChanges();

    lastSceneOptions?.onChopTree();

    expect(dispatchSpy).toHaveBeenCalledWith({ type: 'firewoodGathered', totalFirewood: 3 });
    dispatchSpy.mockRestore();
  });

  it('dispatches forage and forageGathered when the scene reports a harvest that succeeds', () => {
    const dispatchSpy = jest.spyOn(mockDirector, 'dispatch');
    const fixture = TestBed.createComponent(BaseCamp);
    fixture.detectChanges();

    lastSceneOptions?.onForage();

    expect(dispatchSpy).toHaveBeenCalledWith({ type: 'forage' });
    expect(dispatchSpy).toHaveBeenCalledWith({ type: 'forageGathered', totalForage: 2 });
    dispatchSpy.mockRestore();
  });

  it('dispatches a questCompleted event to the scene director when a quest completes', () => {
    const dispatchSpy = jest.spyOn(mockDirector, 'dispatch');
    const fixture = TestBed.createComponent(BaseCamp);
    fixture.detectChanges();

    fixture.componentInstance.completeQuest('q1');

    expect(dispatchSpy).toHaveBeenCalledWith({ type: 'questCompleted', constructionStage: 1 });
    dispatchSpy.mockRestore();
  });
});
