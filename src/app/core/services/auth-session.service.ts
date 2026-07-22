import { Injectable, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth0/auth0-angular';
import { User as Auth0User } from '@auth0/auth0-spa-js';
import { EMPTY, Observable, catchError, combineLatest, filter, map, switchMap, take } from 'rxjs';

import { AuthSession } from '../models/auth-session.model';
import { UserRole } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private readonly debugStorageKey = 'conexion360.auth-debug';
  private readonly auth0 = inject(AuthService);
  readonly isAuthenticated$ = this.auth0.isAuthenticated$;
  readonly isLoading$ = this.auth0.isLoading$;
  readonly authorizationUrl = signal<string | null>(null);
  readonly authError = toSignal(
    this.auth0.error$.pipe(
      map((error) => {
        console.error('[Auth0] Error procesando la autenticacion:', error);
        this.storeAuthDebug('Error procesando la autenticacion con Auth0', {
          name: error.name,
          message: error.message,
        });
        return error.message;
      }),
    ),
    { initialValue: null },
  );

  readonly currentSession = toSignal(
    this.auth0.user$.pipe(map((auth0User) => (auth0User ? this.createSession(auth0User) : null))),
    { initialValue: null },
  );

  constructor() {
    this.printStoredAuthDebug();
    this.showAccessTokenDebug();
  }

  login(emailOrTarget?: string): Observable<void> {
    const isRouteTarget = emailOrTarget?.startsWith('/');
    const target = isRouteTarget && emailOrTarget ? emailOrTarget : '/dashboard';
    const authorizationParams = {
      login_hint: !isRouteTarget ? emailOrTarget?.trim() || undefined : undefined,
      audience: environment.auth0.audience,
      scope: environment.auth0.scope,
      prompt: 'login' as const,
    };

    this.authorizationUrl.set(null);
    this.storeAuthDebug('Solicitud de autenticacion con Auth0', {
      domain: environment.auth0.domain,
      clientId: environment.auth0.clientId,
      target,
      authorizationParams,
    });

    return this.auth0.loginWithRedirect({
      appState: { target },
      authorizationParams,
      openUrl: (url) => this.openAuth0(url),
    });
  }

  register(email?: string): Observable<void> {
    this.authorizationUrl.set(null);

    return this.auth0.loginWithRedirect({
      appState: { target: '/dashboard' },
      authorizationParams: {
        login_hint: email?.trim() || undefined,
        screen_hint: 'signup',
        audience: environment.auth0.audience,
        scope: environment.auth0.scope,
        prompt: 'login',
      },
      openUrl: (url) => this.openAuth0(url),
    });
  }

  clearAuthorizationUrl(): void {
    this.authorizationUrl.set(null);
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
    const accessToken$ = this.auth0.isAuthenticated$
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
      );

    combineLatest([accessToken$, this.auth0.user$.pipe(filter(Boolean), take(1))]).subscribe(
      ([accessToken, auth0User]) => {
        this.simulateBackendSessionFromAuth0(auth0User, accessToken);
      },
    );
  }

  private simulateBackendSessionFromAuth0(auth0User: Auth0User, accessToken: string): void {
    const email = auth0User.email ?? '';
    const role = this.resolveRole(email);

    const requestToBackend = {
      method: 'GET',
      url: `${environment.api.baseUrl}/auth/me`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      expectedValidation: {
        issuer: `https://${environment.auth0.domain}/`,
        audience: environment.auth0.audience,
      },
    };

    const backendResponse = {
      status: 200,
      body: {
        id: auth0User.sub ?? email,
        auth0UserId: auth0User.sub ?? email,
        name: auth0User.name ?? auth0User.nickname ?? email,
        email,
        company: this.resolveCompany(email),
        role,
        isActive: true,
        permissions: ['shipments:read', 'notifications:read', 'reports:read'],
      },
    };

    this.storeAuthDebug('Simulacion de comunicacion con backend', {
      requestToBackend,
      backendResponse,
    });
  }

  private openAuth0(url: string): void {
    this.authorizationUrl.set(url);
    this.storeAuthDebug('URL de autorizacion generada por Auth0', { url });

    const auth0Link = document.createElement('a');
    auth0Link.href = url;
    auth0Link.target = '_self';
    auth0Link.hidden = true;
    document.body.appendChild(auth0Link);
    auth0Link.click();
    auth0Link.remove();
  }

  private storeAuthDebug(label: string, data: unknown): void {
    const previousDebug = this.readStoredAuthDebug();
    const nextDebug = [
      ...previousDebug,
      {
        label,
        data,
        createdAt: new Date().toISOString(),
      },
    ].slice(-10);

    sessionStorage.setItem(this.debugStorageKey, JSON.stringify(nextDebug));
  }

  private printStoredAuthDebug(): void {
    const storedDebug = this.readStoredAuthDebug();

    if (!storedDebug.length) {
      return;
    }

    sessionStorage.removeItem(this.debugStorageKey);
  }

  private readStoredAuthDebug(): Array<{ label: string; data: unknown; createdAt: string }> {
    const rawDebug = sessionStorage.getItem(this.debugStorageKey);

    if (!rawDebug) {
      return [];
    }

    try {
      return JSON.parse(rawDebug) as Array<{ label: string; data: unknown; createdAt: string }>;
    } catch {
      sessionStorage.removeItem(this.debugStorageKey);
      return [];
    }
  }
}
