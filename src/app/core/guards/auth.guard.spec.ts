import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthSessionService } from '../services/auth-session.service';

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
  });

  it('should redirect anonymous users to login', () => {
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    const router = TestBed.inject(Router);

    expect(result).toEqual(router.createUrlTree(['/login']));
  });

  it('should allow authenticated users', (done) => {
    const authSession = TestBed.inject(AuthSessionService);

    authSession.login('cliente@demo.com', 'Demo1234').subscribe(() => {
      const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

      expect(result).toBeTrue();
      done();
    });
  });
});
