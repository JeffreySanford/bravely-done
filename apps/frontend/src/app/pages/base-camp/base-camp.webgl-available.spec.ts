import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CharacterApiService } from '../../core/character-api.service';

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
        { provide: CharacterApiService, useValue: { list: jest.fn().mockReturnValue(of([])) } },
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
});
