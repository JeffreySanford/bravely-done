import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ApiConfiguration } from '../api/api-configuration';
import { QuestApiService } from './quest-api.service';

describe('QuestApiService', () => {
  let service: QuestApiService;
  let httpMock: HttpTestingController;

  const quest = {
    id: 'q1',
    characterId: 'c1',
    title: 'Answer three emails',
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
    service = TestBed.inject(QuestApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('list gets /characters/:id/quests', () => {
    let result: unknown;
    service.list('c1').subscribe((res) => (result = res));

    const req = httpMock.expectOne('http://test/characters/c1/quests');
    expect(req.request.method).toBe('GET');
    req.flush([quest]);

    expect(result).toEqual([quest]);
  });

  it('create posts to /characters/:id/quests', () => {
    let result: unknown;
    service.create('c1', { title: 'Answer three emails' }).subscribe((res) => (result = res));

    const req = httpMock.expectOne('http://test/characters/c1/quests');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'Answer three emails' });
    req.flush(quest);

    expect(result).toEqual(quest);
  });

  it('complete posts to /quests/:id/complete', () => {
    let result: unknown;
    service.complete('q1').subscribe((res) => (result = res));

    const req = httpMock.expectOne('http://test/quests/q1/complete');
    expect(req.request.method).toBe('POST');
    const character = {
      id: 'c1',
      name: 'Ember Scout',
      createdAt: '2026-01-01T00:00:00.000Z',
      hasArrivedAtCamp: true,
      campConstructionStage: 1,
    };
    req.flush({ quest: { ...quest, status: 'COMPLETED' }, character });

    expect(result).toEqual({ quest: { ...quest, status: 'COMPLETED' }, character });
  });

  it('retreat posts to /quests/:id/retreat', () => {
    let result: unknown;
    service.retreat('q1').subscribe((res) => (result = res));

    const req = httpMock.expectOne('http://test/quests/q1/retreat');
    expect(req.request.method).toBe('POST');
    const retreated = { ...quest, status: 'RETREATED' };
    req.flush(retreated);

    expect(result).toEqual(retreated);
  });
});
