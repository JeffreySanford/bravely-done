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
      import('./pages/character-create/character-create').then((m) => m.CharacterCreate),
  },
  {
    path: 'characters',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/character-list/character-list').then((m) => m.CharacterList),
  },
  {
    path: 'basecamp/:characterId',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/base-camp/base-camp').then((m) => m.BaseCamp),
  },
  { path: '**', redirectTo: 'login' },
];
