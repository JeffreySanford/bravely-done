import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiConfiguration } from '../api/api-configuration';
import { authControllerLogin } from '../api/fn/auth/auth-controller-login';
import { authControllerLogout } from '../api/fn/auth/auth-controller-logout';
import { authControllerMe } from '../api/fn/auth/auth-controller-me';
import { authControllerSignup } from '../api/fn/auth/auth-controller-signup';
import { AuthUserDto } from '../api/models/auth-user-dto';
import { LoginDto } from '../api/models/login-dto';
import { SessionDto } from '../api/models/session-dto';
import { SignupDto } from '../api/models/signup-dto';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfiguration);

  signup(body: SignupDto): Observable<AuthUserDto> {
    return authControllerSignup(this.http, this.config.rootUrl, { body }).pipe(
      map((res) => res.body),
    );
  }

  login(body: LoginDto): Observable<AuthUserDto> {
    return authControllerLogin(this.http, this.config.rootUrl, { body }).pipe(
      map((res) => res.body),
    );
  }

  logout(): Observable<void> {
    return authControllerLogout(this.http, this.config.rootUrl).pipe(map(() => undefined));
  }

  me(): Observable<SessionDto> {
    return authControllerMe(this.http, this.config.rootUrl).pipe(map((res) => res.body));
  }
}
