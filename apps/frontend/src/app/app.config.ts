import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideApiConfiguration } from './api/api-configuration';
import { AuthStateService } from './core/auth-state.service';
import { credentialsInterceptor } from './core/credentials.interceptor';
import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';

export function restoreSessionInitializer(): Promise<void> {
  return inject(AuthStateService).restoreSession();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(withFetch(), withInterceptors([credentialsInterceptor])),
    provideApiConfiguration(environment.apiUrl),
    // Resolve the existing cookie session (if any) before the router
    // activates, so auth guards never run against unknown state.
    provideAppInitializer(restoreSessionInitializer),
  ],
};
