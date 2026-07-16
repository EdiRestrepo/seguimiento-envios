import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthSessionService } from '../services/auth-session.service';

export const authGuard: CanActivateFn | CanActivateChildFn = () => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  return authSession.isAuthenticated$.pipe(
    map((isAuthenticated) => (isAuthenticated ? true : router.createUrlTree(['/login']))),
  );
};
