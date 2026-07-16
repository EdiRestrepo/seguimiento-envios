import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth0/auth0-angular';
import { User as Auth0User } from '@auth0/auth0-spa-js';
import { EMPTY, Observable, catchError, filter, map, switchMap, take } from 'rxjs';

import { AuthSession } from '../models/auth-session.model';
import { UserRole } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private readonly auth0 = inject(AuthService);
  readonly isAuthenticated$ = this.auth0.isAuthenticated$;
  readonly isLoading$ = this.auth0.isLoading$;

  readonly currentSession = toSignal(
    this.auth0.user$.pipe(map((auth0User) => (auth0User ? this.createSession(auth0User) : null))),
    { initialValue: null },
  );

  constructor() {
    this.showAccessTokenDebug();
  }

  login(emailOrTarget?: string): Observable<void> {
    const isRouteTarget = emailOrTarget?.startsWith('/');

    return this.auth0.loginWithRedirect({
      appState: {
        target: isRouteTarget ? emailOrTarget : '/dashboard',
      },
      authorizationParams: {
        login_hint: !isRouteTarget ? emailOrTarget?.trim() || undefined : undefined,
      },
    });
  }

  register(email?: string): Observable<void> {
    return this.auth0.loginWithRedirect({
      appState: { target: '/dashboard' },
      authorizationParams: {
        login_hint: email?.trim() || undefined,
        screen_hint: 'signup',
      },
    });
  }

  logout(): Observable<void> {
    return this.auth0.logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  }

  private createSession(auth0User: Auth0User): AuthSession {
    const email = auth0User.email ?? '';

    return {
      user: {
        id: auth0User.sub ?? email,
        name: auth0User.name ?? auth0User.nickname ?? email,
        email,
        role: this.resolveRole(email),
        company: this.resolveCompany(email),
      },
      accessToken: '',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
    };
  }

  private resolveRole(email: string): UserRole {
    const normalizedEmail = email.toLowerCase();

    if (normalizedEmail === 'administrador@demo.com') {
      return 'ADMIN';
    }

    if (normalizedEmail === 'operador@demo.com') {
      return 'OPERATOR';
    }

    return 'CLIENT';
  }

  private resolveCompany(email: string): string {
    return email.toLowerCase() === 'cliente@demo.com' ? 'Cliente Demo' : 'Conexion360';
  }

  private showAccessTokenDebug(): void {
    this.auth0.isAuthenticated$
      .pipe(
        filter(Boolean),
        take(1),
        switchMap(() =>
          this.auth0
            .getAccessTokenSilently({
              authorizationParams: {
                audience: environment.auth0.audience,
                scope: environment.auth0.scope,
              },
            })
            .pipe(
            catchError((error: Error) => {
              console.error('[Auth0] No fue posible obtener el access_token', error);
              return EMPTY;
            }),
          ),
        ),
      )
      .subscribe((accessToken) => {
        console.log('[Auth0] access_token:', accessToken);
        window.alert(`Auth0 access_token:\n\n${accessToken}`);
      });

    this.auth0.user$.pipe(filter(Boolean), take(1)).subscribe((auth0User) => {
      console.log('[Auth0] user profile:', auth0User);
      console.log('[Auth0] user_metadata:', auth0User['user_metadata'] ?? 'No viene en el perfil actual.');
    });
  }
}
