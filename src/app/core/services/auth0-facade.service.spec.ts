import { TestBed } from '@angular/core/testing';
import { AuthService } from '@auth0/auth0-angular';
import { EMPTY, of } from 'rxjs';

import { Auth0FacadeService } from './auth0-facade.service';

describe('Auth0FacadeService', () => {
  let loginWithRedirectSpy: jasmine.Spy;
  let logoutSpy: jasmine.Spy;
  let service: Auth0FacadeService;

  beforeEach(() => {
    loginWithRedirectSpy = jasmine.createSpy('loginWithRedirect').and.returnValue(of(undefined));
    logoutSpy = jasmine.createSpy('logout').and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      providers: [
        Auth0FacadeService,
        {
          provide: AuthService,
          useValue: {
            error$: EMPTY,
            isAuthenticated$: of(false),
            isLoading$: of(false),
            loginWithRedirect: loginWithRedirectSpy,
            logout: logoutSpy,
            user$: of(null),
          },
        },
      ],
    });
    service = TestBed.inject(Auth0FacadeService);
  });

  it('should start Auth0 signup with screen_hint signup', () => {
    service.signup('nuevo@demo.com').subscribe();

    expect(loginWithRedirectSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        authorizationParams: jasmine.objectContaining({
          login_hint: 'nuevo@demo.com',
          screen_hint: 'signup',
        }),
      }),
    );
  });

  it('should start Auth0 logout', () => {
    service.logout().subscribe();

    expect(logoutSpy).toHaveBeenCalled();
  });
});
