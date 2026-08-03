import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { AuthStateService } from './auth-state.service';

function buildAuthApiMock() {
  return {
    signup: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    me: jest.fn(),
  };
}

describe('AuthStateService', () => {
  let authApi: ReturnType<typeof buildAuthApiMock>;
  let service: AuthStateService;

  beforeEach(() => {
    authApi = buildAuthApiMock();
    TestBed.configureTestingModule({
      providers: [{ provide: AuthApiService, useValue: authApi }],
    });
    service = TestBed.inject(AuthStateService);
  });

  it('starts unauthenticated and unrestored', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.restored()).toBe(false);
    expect(service.session()).toBeNull();
  });

  it('signup sets the session from the returned user', () => {
    authApi.signup.mockReturnValue(of({ id: 'u1', email: 'a@example.com', role: 'PLAYER' }));

    service.signup('a@example.com', 'correcthorsebattery').subscribe();

    expect(service.isAuthenticated()).toBe(true);
    expect(service.session()).toEqual({ sub: 'u1', role: 'PLAYER' });
  });

  it('login sets the session from the returned user', () => {
    authApi.login.mockReturnValue(of({ id: 'u1', email: 'a@example.com', role: 'PLAYER' }));

    service.login('a@example.com', 'correcthorsebattery').subscribe();

    expect(service.session()).toEqual({ sub: 'u1', role: 'PLAYER' });
  });

  it('logout clears the session', () => {
    authApi.login.mockReturnValue(of({ id: 'u1', email: 'a@example.com', role: 'PLAYER' }));
    authApi.logout.mockReturnValue(of(undefined));

    service.login('a@example.com', 'x').subscribe();
    expect(service.isAuthenticated()).toBe(true);

    service.logout().subscribe();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('restoreSession sets the session and marks restored on success', async () => {
    authApi.me.mockReturnValue(of({ sub: 'u1', role: 'PLAYER' }));

    await service.restoreSession();

    expect(service.session()).toEqual({ sub: 'u1', role: 'PLAYER' });
    expect(service.restored()).toBe(true);
  });

  it('restoreSession clears the session and still marks restored on failure', async () => {
    authApi.me.mockReturnValue(throwError(() => new Error('401')));

    await service.restoreSession();

    expect(service.session()).toBeNull();
    expect(service.restored()).toBe(true);
  });
});
