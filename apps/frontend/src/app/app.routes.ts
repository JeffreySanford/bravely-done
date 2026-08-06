import { Route } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/signup/signup').then((m) => m.Signup),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'characters/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/character-create/character-create').then(
        (m) => m.CharacterCreate,
      ),
  },
  {
    path: 'characters',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/character-list/character-list').then(
        (m) => m.CharacterList,
      ),
  },
  // Declared before 'basecamp/:characterId' — the more specific path has to
  // win. A real destination rather than another Base Camp overlay: the board
  // already occupies that pattern, and a third layer over the 3D scene is
  // exactly the crowding that got the quest board moved once already.
  {
    path: 'basecamp/:characterId/chronicle',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/chronicle/chronicle').then((m) => m.Chronicle),
  },
  {
    path: 'basecamp/:characterId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/base-camp/base-camp').then((m) => m.BaseCamp),
  },
  { path: '**', redirectTo: 'login' },
];
