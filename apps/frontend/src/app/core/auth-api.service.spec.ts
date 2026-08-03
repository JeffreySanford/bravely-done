import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ApiConfiguration } from '../api/api-configuration';
import { AuthApiService } from './auth-api.service';

describe('AuthApiService', () => {
  let service: AuthApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiConfiguration, useValue: { rootUrl: 'http://test' } },
      ],
    });
    service = TestBed.inject(AuthApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('signup posts to /auth/signup and returns the created user', () => {
    const body = { email: 'a@example.com', password: 'correcthorsebattery' };
    let result: unknown;

    service.signup(body).subscribe((res) => (result = res));

    const req = httpMock.expectOne('http://test/auth/signup');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ id: 'u1', email: body.email, role: 'PLAYER' });

    expect(result).toEqual({ id: 'u1', email: body.email, role: 'PLAYER' });
  });

  it('login posts to /auth/login', () => {
    const body = { email: 'a@example.com', password: 'x' };
    service.login(body).subscribe();

    const req = httpMock.expectOne('http://test/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'u1', email: body.email, role: 'PLAYER' });
  });

  it('logout posts to /auth/logout', () => {
    service.logout().subscribe();

    const req = httpMock.expectOne('http://test/auth/logout');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
  });

  it('me gets /auth/me', () => {
    let result: unknown;
    service.me().subscribe((res) => (result = res));

    const req = httpMock.expectOne('http://test/auth/me');
    expect(req.request.method).toBe('GET');
    req.flush({ sub: 'u1', role: 'PLAYER' });

    expect(result).toEqual({ sub: 'u1', role: 'PLAYER' });
  });
});
