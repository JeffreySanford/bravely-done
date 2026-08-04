import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ApiConfiguration } from '../api/api-configuration';
import { CharacterApiService } from './character-api.service';

describe('CharacterApiService', () => {
  let service: CharacterApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiConfiguration, useValue: { rootUrl: 'http://test' } },
      ],
    });
    service = TestBed.inject(CharacterApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('list gets /characters', () => {
    let result: unknown;
    service.list().subscribe((res) => (result = res));

    const req = httpMock.expectOne('http://test/characters');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 'c1', name: 'Ember Scout', createdAt: '2026-01-01T00:00:00.000Z' }]);

    expect(result).toEqual([{ id: 'c1', name: 'Ember Scout', createdAt: '2026-01-01T00:00:00.000Z' }]);
  });

  it('create posts to /characters', () => {
    let result: unknown;
    service.create({ name: 'Ember Scout' }).subscribe((res) => (result = res));

    const req = httpMock.expectOne('http://test/characters');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Ember Scout' });
    req.flush({ id: 'c1', name: 'Ember Scout', createdAt: '2026-01-01T00:00:00.000Z' });

    expect(result).toEqual({ id: 'c1', name: 'Ember Scout', createdAt: '2026-01-01T00:00:00.000Z' });
  });

  it('arrive posts to /characters/:id/arrive', () => {
    let result: unknown;
    service.arrive('c1').subscribe((res) => (result = res));

    const req = httpMock.expectOne('http://test/characters/c1/arrive');
    expect(req.request.method).toBe('POST');
    const character = {
      id: 'c1',
      name: 'Ember Scout',
      createdAt: '2026-01-01T00:00:00.000Z',
      hasArrivedAtCamp: true,
      campConstructionStage: 0,
    };
    req.flush({ firstArrival: true, character });

    expect(result).toEqual({ firstArrival: true, character });
  });

  it('completeMockQuest posts to /characters/:id/complete-mock-quest', () => {
    let result: unknown;
    service.completeMockQuest('c1').subscribe((res) => (result = res));

    const req = httpMock.expectOne('http://test/characters/c1/complete-mock-quest');
    expect(req.request.method).toBe('POST');
    const character = {
      id: 'c1',
      name: 'Ember Scout',
      createdAt: '2026-01-01T00:00:00.000Z',
      hasArrivedAtCamp: true,
      campConstructionStage: 1,
    };
    req.flush(character);

    expect(result).toEqual(character);
  });
});
