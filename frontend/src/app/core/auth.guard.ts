import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ROLE_HOME, RoleName } from './models';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

export function roleGuard(roles: RoleName[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const session = auth.session();

    if (!session) {
      return router.createUrlTree(['/login']);
    }

    if (auth.hasAnyRole(roles)) {
      return true;
    }

    return router.createUrlTree([ROLE_HOME[session.preferredRole]]);
  };
}
