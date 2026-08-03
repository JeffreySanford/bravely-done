import { TestBed } from '@angular/core/testing';
import { appConfig, restoreSessionInitializer } from './app.config';
import { AuthStateService } from './core/auth-state.service';

describe('appConfig', () => {
  it('provides the application providers', () => {
    expect(appConfig.providers.length).toBeGreaterThan(0);
  });
});

describe('restoreSessionInitializer', () => {
  it('delegates to AuthStateService.restoreSession', () => {
    const restoreSession = jest.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [{ provide: AuthStateService, useValue: { restoreSession } }],
    });

    TestBed.runInInjectionContext(() => restoreSessionInitializer());

    expect(restoreSession).toHaveBeenCalled();
  });
});
