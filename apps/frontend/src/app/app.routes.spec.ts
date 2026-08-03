import { appRoutes } from './app.routes';
import { authGuard, guestGuard } from './core/auth.guard';

function findRoute(path: string) {
  const route = appRoutes.find((r) => r.path === path);
  if (!route) {
    throw new Error(`No route registered for path "${path}"`);
  }
  return route;
}

describe('appRoutes', () => {
  it('is defined as an array', () => {
    expect(Array.isArray(appRoutes)).toBe(true);
  });

  it('redirects the empty path to /login', () => {
    const root = appRoutes.find((r) => r.path === '');
    expect(root?.redirectTo).toBe('login');
  });

  it('guards guest-only routes and lazy-loads their components', async () => {
    for (const path of ['signup', 'login']) {
      const route = findRoute(path);
      expect(route.canActivate).toEqual([guestGuard]);
      const component = await route.loadComponent?.();
      expect(component).toBeDefined();
    }
  });

  it('guards authenticated routes and lazy-loads their components', async () => {
    for (const path of ['characters/new', 'characters']) {
      const route = findRoute(path);
      expect(route.canActivate).toEqual([authGuard]);
      const component = await route.loadComponent?.();
      expect(component).toBeDefined();
    }
  });

  it('falls back unknown paths to /login', () => {
    const wildcard = appRoutes.find((r) => r.path === '**');
    expect(wildcard?.redirectTo).toBe('login');
  });
});
