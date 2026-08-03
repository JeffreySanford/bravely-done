import { appConfig } from './app.config';

describe('appConfig', () => {
  it('provides the application providers', () => {
    expect(appConfig.providers.length).toBeGreaterThan(0);
  });
});
