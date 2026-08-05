import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideApiConfiguration } from './api/api-configuration';
import { AuthStateService } from './core/auth-state.service';
import { credentialsInterceptor } from './core/credentials.interceptor';
import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';
import { campFeature } from './state/camp/camp.reducer';
import { CampEffects } from './state/camp/camp.effects';
import { questsFeature } from './state/quests/quests.reducer';
import { QuestsEffects } from './state/quests/quests.effects';
import { sprintsFeature } from './state/sprints/sprints.reducer';
import { SprintsEffects } from './state/sprints/sprints.effects';
import { encountersFeature } from './state/encounters/encounters.reducer';
import { EncountersEffects } from './state/encounters/encounters.effects';

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
    provideStore({
      [questsFeature.name]: questsFeature.reducer,
      [campFeature.name]: campFeature.reducer,
      [sprintsFeature.name]: sprintsFeature.reducer,
      [encountersFeature.name]: encountersFeature.reducer,
    }),
    provideEffects(QuestsEffects, CampEffects, SprintsEffects, EncountersEffects),
  ],
};
