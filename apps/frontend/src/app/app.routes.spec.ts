import { appRoutes } from './app.routes';

describe('appRoutes', () => {
  it('is defined as an array', () => {
    expect(Array.isArray(appRoutes)).toBe(true);
  });
});
