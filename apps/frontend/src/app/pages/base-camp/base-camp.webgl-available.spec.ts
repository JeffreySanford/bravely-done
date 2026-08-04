import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { of } from 'rxjs';
import { CharacterApiService } from '../../core/character-api.service';
import { QuestApiService } from '../../core/quest-api.service';
import { AnimationDirector } from '../../game-rendering/animation-director';
import { QuestsEffects } from '../../state/quests/quests.effects';
import { questsFeature } from '../../state/quests/quests.reducer';

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

const { BaseCamp } = require('./base-camp');
const { RendererLifecycle } = require('../../game-rendering/renderer-lifecycle');

describe('BaseCamp (WebGL available)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [BaseCamp],
      providers: [
        provideRouter([]),
        provideStore({ [questsFeature.name]: questsFeature.reducer }),
        provideEffects(QuestsEffects),
        {
          provide: CharacterApiService,
          useValue: {
            arrive: jest.fn().mockReturnValue(
              of({
                firstArrival: true,
                character: { id: 'c1', name: 'Ember Scout', createdAt: '2026-01-01', hasArrivedAtCamp: true, campConstructionStage: 0 },
              }),
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
                character: { id: 'c1', name: 'Ember Scout', createdAt: '2026-01-01', hasArrivedAtCamp: true, campConstructionStage: 1 },
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

  it('dispatches a questCompleted event to the scene director when a quest completes', () => {
    const dispatchSpy = jest.spyOn(AnimationDirector.prototype, 'dispatch');
    const fixture = TestBed.createComponent(BaseCamp);
    fixture.detectChanges();

    fixture.componentInstance.completeQuest('q1');

    expect(dispatchSpy).toHaveBeenCalledWith({ type: 'questCompleted', constructionStage: 1 });
    dispatchSpy.mockRestore();
  });
});
