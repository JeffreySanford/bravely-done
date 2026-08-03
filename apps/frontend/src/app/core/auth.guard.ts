import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from './auth-state.service';

/** Guards routes that require an authenticated session (e.g. character creation). */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthStateService);
  const router = inject(Router);
  return auth.isAuthenticated() || router.createUrlTree(['/login']);
};

/** Guards routes that only make sense for a signed-out visitor (login/signup). */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthStateService);
  const router = inject(Router);
  return !auth.isAuthenticated() || router.createUrlTree(['/characters']);
};
