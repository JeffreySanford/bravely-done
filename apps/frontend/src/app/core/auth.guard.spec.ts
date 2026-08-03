import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard, guestGuard } from './auth.guard';
import { AuthStateService } from './auth-state.service';

describe('auth guards', () => {
  function setup(isAuthenticated: boolean) {
    const urlTree = {} as UrlTree;
    const router = { createUrlTree: jest.fn().mockReturnValue(urlTree) };
    const auth = { isAuthenticated: () => isAuthenticated };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStateService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });

    return { router, urlTree };
  }

  describe('authGuard', () => {
    it('allows access when authenticated', () => {
      setup(true);
      const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
      expect(result).toBe(true);
    });

    it('redirects to /login when not authenticated', () => {
      const { router, urlTree } = setup(false);
      const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
      expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
      expect(result).toBe(urlTree);
    });
  });

  describe('guestGuard', () => {
    it('allows access when not authenticated', () => {
      setup(false);
      const result = TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));
      expect(result).toBe(true);
    });

    it('redirects to /characters when already authenticated', () => {
      const { router, urlTree } = setup(true);
      const result = TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));
      expect(router.createUrlTree).toHaveBeenCalledWith(['/characters']);
      expect(result).toBe(urlTree);
    });
  });
});
