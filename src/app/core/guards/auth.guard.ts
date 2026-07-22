import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { combineLatest, filter, map, of, switchMap, take } from 'rxjs';

import { Auth0FacadeService } from '../services/auth0-facade.service';
import { MockUserProfileService } from '../../mocks/services/mock-user-profile.service';

export const authGuard: CanActivateFn | CanActivateChildFn = (_route, state) => {
  const auth0Facade = inject(Auth0FacadeService);
  const userProfileService = inject(MockUserProfileService);
  const router = inject(Router);

  return auth0Facade.isLoading$.pipe(
    filter((isLoading) => !isLoading),
    take(1),
    switchMap(() => combineLatest([auth0Facade.isAuthenticated$, auth0Facade.user$]).pipe(take(1))),
    switchMap(([isAuthenticated, identity]) => {
      const isCompletingProfile = state.url.startsWith('/complete-profile');

      if (!isAuthenticated) {
        return of(router.createUrlTree(['/login']));
      }

      if (!identity) {
        return of(isCompletingProfile ? true : router.createUrlTree(['/complete-profile']));
      }

      return userProfileService.completeProfileFromIdentity(identity).pipe(
        map((profile) => {
          if (profile) {
            return isCompletingProfile ? router.createUrlTree(['/dashboard']) : true;
          }

          return isCompletingProfile ? true : router.createUrlTree(['/complete-profile']);
        }),
      );
    }),
  );
};
