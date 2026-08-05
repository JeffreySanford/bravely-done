import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ApiConfiguration } from '../api/api-configuration';
import { SprintApiService } from './sprint-api.service';

describe('SprintApiService', () => {
  let service: SprintApiService;
  let httpMock: HttpTestingController;

  const sprint = {
    id: 's1',
    questId: 'q1',
    targetSeconds: 900,
    startedAt: '2026-01-01T00:00:00.000Z',
    pausedAt: null,
    pausedSeconds: 0,
    status: 'ACTIVE' as const,
    completedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiConfiguration, useValue: { rootUrl: 'http://test' } },
      ],
    });
    service = TestBed.inject(SprintApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('start posts to /quests/:questId/sprints', () => {
    let result: unknown;
    service.start('q1', { targetSeconds: 900 }).subscribe((res) => (result = res));

    const req = httpMock.expectOne('http://test/quests/q1/sprints');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ targetSeconds: 900 });
    req.flush(sprint);

    expect(result).toEqual(sprint);
  });

  it('list gets /quests/:questId/sprints', () => {
    let result: unknown;
    service.list('q1').subscribe((res) => (result = res));

    const req = httpMock.expectOne('http://test/quests/q1/sprints');
    expect(req.request.method).toBe('GET');
    req.flush([sprint]);

    expect(result).toEqual([sprint]);
  });

  it('pause posts to /sprints/:id/pause', () => {
    let result: unknown;
    service.pause('s1').subscribe((res) => (result = res));

    const req = httpMock.expectOne('http://test/sprints/s1/pause');
    expect(req.request.method).toBe('POST');
    const paused = { ...sprint, status: 'PAUSED' as const, pausedAt: '2026-01-01T00:05:00.000Z' };
    req.flush(paused);

    expect(result).toEqual(paused);
  });

  it('resume posts to /sprints/:id/resume', () => {
    let result: unknown;
    service.resume('s1').subscribe((res) => (result = res));

    const req = httpMock.expectOne('http://test/sprints/s1/resume');
    expect(req.request.method).toBe('POST');
    req.flush(sprint);

    expect(result).toEqual(sprint);
  });

  it('complete posts to /sprints/:id/complete', () => {
    let result: unknown;
    service.complete('s1').subscribe((res) => (result = res));

    const req = httpMock.expectOne('http://test/sprints/s1/complete');
    expect(req.request.method).toBe('POST');
    const character = {
      id: 'c1',
      name: 'Ember Scout',
      createdAt: '2026-01-01T00:00:00.000Z',
      hasArrivedAtCamp: true,
      campConstructionStage: 1,
    };
    const completed = { ...sprint, status: 'COMPLETED' as const, completedAt: '2026-01-01T00:15:00.000Z' };
    req.flush({ sprint: completed, character });

    expect(result).toEqual({ sprint: completed, character });
  });
});
