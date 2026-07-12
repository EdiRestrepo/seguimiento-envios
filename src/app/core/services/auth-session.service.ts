import { Injectable, signal } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';

import { AuthSession } from '../models/auth-session.model';
import { User, UserRole } from '../models/user.model';

interface SimulatedCredential {
  user: User;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private readonly storageKey = 'nexcargo.session';
  private readonly credentials: SimulatedCredential[] = [
    {
      user: {
        id: 'user-client',
        name: 'Edison Restrepo',
        email: 'cliente@demo.com',
        role: 'CLIENT',
        company: 'Cliente Demo',
      },
      password: 'Demo1234',
    },
    {
      user: {
        id: 'user-operator',
        name: 'Operador Demo',
        email: 'operador@demo.com',
        role: 'OPERATOR',
        company: 'NexCargo',
      },
      password: 'Demo1234',
    },
    {
      user: {
        id: 'user-admin',
        name: 'Administrador Demo',
        email: 'administrador@demo.com',
        role: 'ADMIN',
        company: 'NexCargo',
      },
      password: 'Demo1234',
    },
  ];

  private readonly sessionState = signal<AuthSession | null>(this.readStoredSession());

  readonly currentSession = this.sessionState.asReadonly();

  login(email: string, password: string): Observable<AuthSession> {
    const credential = this.credentials.find(
      (item) => item.user.email.toLowerCase() === email.trim().toLowerCase() && item.password === password,
    );

    if (!credential) {
      return throwError(() => new Error('Credenciales incorrectas. Verifica el correo y la contraseña.'));
    }

    const session: AuthSession = {
      user: credential.user,
      accessToken: `mock-token-${credential.user.id}`,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
    };

    this.storeSession(session);
    return of(session).pipe(delay(450));
  }

  register(name: string, email: string, role: UserRole = 'CLIENT'): Observable<AuthSession> {
    const session: AuthSession = {
      user: {
        id: `registered-${Date.now()}`,
        name,
        email,
        role,
      },
      accessToken: 'mock-token-registered-user',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
    };

    this.storeSession(session);
    return of(session).pipe(delay(450));
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.sessionState.set(null);
  }

  isAuthenticated(): boolean {
    const session = this.sessionState();
    return Boolean(session && new Date(session.expiresAt).getTime() > Date.now());
  }

  private storeSession(session: AuthSession): void {
    localStorage.setItem(this.storageKey, JSON.stringify(session));
    this.sessionState.set(session);
  }

  private readStoredSession(): AuthSession | null {
    const rawSession = localStorage.getItem(this.storageKey);

    if (!rawSession) {
      return null;
    }

    try {
      const session = JSON.parse(rawSession) as AuthSession;
      return new Date(session.expiresAt).getTime() > Date.now() ? session : null;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }
}
