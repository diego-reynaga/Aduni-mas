import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ROLE_HOME, RoleName } from './models';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ensureInitialized();
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

export function roleGuard(roles: RoleName[]): CanActivateFn {
  return async () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    await auth.ensureInitialized();
    const session = auth.session();
    if (!session) return router.createUrlTree(['/login']);
    return auth.hasAnyRole(roles) ? true : router.createUrlTree([ROLE_HOME[session.preferredRole]]);
  };
}
