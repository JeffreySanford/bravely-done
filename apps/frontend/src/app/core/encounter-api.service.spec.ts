import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ApiConfiguration } from '../api/api-configuration';
import { EncounterApiService } from './encounter-api.service';

describe('EncounterApiService', () => {
  let service: EncounterApiService;
  let httpMock: HttpTestingController;

  const encounter = {
    id: 'enc-1',
    questId: 'q1',
    title: 'Draft the reply',
    status: 'OPEN' as const,
    createdAt: '2026-01-01T00:00:00.000Z',
    completedAt: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiConfiguration, useValue: { rootUrl: 'http://test' } },
      ],
    });
    service = TestBed.inject(EncounterApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('create posts to /quests/:questId/encounters', () => {
    let result: unknown;
    service.create('q1', { title: 'Draft the reply' }).subscribe((res) => (result = res));

    const req = httpMock.expectOne('http://test/quests/q1/encounters');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'Draft the reply' });
    req.flush(encounter);

    expect(result).toEqual(encounter);
  });

  it('list gets /quests/:questId/encounters', () => {
    let result: unknown;
    service.list('q1').subscribe((res) => (result = res));

    const req = httpMock.expectOne('http://test/quests/q1/encounters');
    expect(req.request.method).toBe('GET');
    req.flush([encounter]);

    expect(result).toEqual([encounter]);
  });

  it('complete posts to /encounters/:id/complete', () => {
    let result: unknown;
    service.complete('enc-1').subscribe((res) => (result = res));

    const req = httpMock.expectOne('http://test/encounters/enc-1/complete');
    expect(req.request.method).toBe('POST');
    const character = {
      id: 'c1',
      name: 'Ember Scout',
      createdAt: '2026-01-01T00:00:00.000Z',
      hasArrivedAtCamp: true,
      campConstructionStage: 1,
    };
    const completed = { ...encounter, status: 'COMPLETED' as const, completedAt: '2026-01-01T00:05:00.000Z' };
    req.flush({ encounter: completed, character });

    expect(result).toEqual({ encounter: completed, character });
  });
});
