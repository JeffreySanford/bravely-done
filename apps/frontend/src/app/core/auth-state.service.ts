import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { AuthUserDto } from '../api/models/auth-user-dto';
import { SessionDto } from '../api/models/session-dto';

function toSession(user: AuthUserDto): SessionDto {
  return { sub: user.id, role: user.role };
}

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly authApi = inject(AuthApiService);

  private readonly _session = signal<SessionDto | null>(null);
  private readonly _restored = signal(false);

  readonly session = this._session.asReadonly();
  readonly isAuthenticated = computed(() => this._session() !== null);
  /** True once the initial cookie-session check (restoreSession) has resolved. */
  readonly restored = this._restored.asReadonly();

  signup(email: string, password: string) {
    // signup/login already return the created/authenticated user, so the
    // session signal is set synchronously within the same response — no
    // extra round-trip, and no race with whatever the caller does next
    // (e.g. navigating past an auth guard).
    return this.authApi.signup({ email, password }).pipe(tap((user) => this._session.set(toSession(user))));
  }

  login(email: string, password: string) {
    return this.authApi.login({ email, password }).pipe(tap((user) => this._session.set(toSession(user))));
  }

  logout() {
    return this.authApi.logout().pipe(tap(() => this._session.set(null)));
  }

  /**
   * Checks for an existing httpOnly-cookie session. Returns a promise so it
   * can be awaited by an app initializer, ensuring route guards never run
   * before the initial auth state is known.
   */
  restoreSession(): Promise<void> {
    return new Promise((resolvePromise) => {
      this.authApi
        .me()
        .pipe(
          tap((session) => this._session.set(session)),
          catchError(() => {
            this._session.set(null);
            return of(null);
          }),
        )
        .subscribe(() => {
          this._restored.set(true);
          resolvePromise();
        });
    });
  }
}
