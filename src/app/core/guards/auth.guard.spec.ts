import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, provideRouter } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

import { authGuard } from './auth.guard';
import { AuthSessionService } from '../services/auth-session.service';

describe('authGuard', () => {
  let isAuthenticatedSubject: BehaviorSubject<boolean>;

  beforeEach(() => {
    isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthSessionService,
          useValue: {
            isAuthenticated$: isAuthenticatedSubject.asObservable(),
          },
        },
      ],
    });
  });

  it('should redirect anonymous users to the local login page', (done) => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/dashboard' } as RouterStateSnapshot),
    ) as Observable<boolean | ReturnType<Router['createUrlTree']>>;
    const router = TestBed.inject(Router);

    result.subscribe((canActivate) => {
      expect(canActivate).toEqual(router.createUrlTree(['/login']));
      done();
    });
  });

  it('should allow authenticated users', (done) => {
    isAuthenticatedSubject.next(true);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/dashboard' } as RouterStateSnapshot),
    ) as Observable<boolean>;

    result.subscribe((canActivate) => {
      expect(canActivate).toBeTrue();
      done();
    });
  });
});
