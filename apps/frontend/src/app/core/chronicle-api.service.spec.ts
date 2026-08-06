import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiConfiguration } from '../api/api-configuration';
import { ChronicleApiService } from './chronicle-api.service';

describe('ChronicleApiService', () => {
  let service: ChronicleApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiConfiguration, useValue: { rootUrl: 'http://test' } },
      ],
    });
    service = TestBed.inject(ChronicleApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('gets /characters/:id/chronicle', () => {
    let result: unknown;
    service.forCharacter('c1').subscribe((res) => (result = res));

    const req = httpMock.expectOne(
      (r) => r.url === 'http://test/characters/c1/chronicle',
    );
    expect(req.request.method).toBe('GET');
    // No days param unless asked for — the backend's weekly default stands.
    expect(req.request.params.has('days')).toBe(false);
    const chronicle = { characterId: 'c1', entries: [] };
    req.flush(chronicle);

    expect(result).toEqual(chronicle);
  });

  it('passes days through when a caller asks for a different window', () => {
    service.forCharacter('c1', 14).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === 'http://test/characters/c1/chronicle',
    );
    expect(req.request.params.get('days')).toBe('14');
    req.flush({ characterId: 'c1', entries: [] });
  });
});
