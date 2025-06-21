import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { UserService } from './user.service';
import { LoggerService } from './logger.service';

export function userAuthentication(): CanActivateFn {
  return (route, state) => {
    const userService = inject(UserService);
    const router = inject(Router);
    const loggerService = inject(LoggerService);

    loggerService.debug(`[UserAuthentication] Trying to access ${state.url}`);

    return userService.getUser().pipe(
      map((user) => {
        if (user?.isAuthenticated) {
          loggerService.debug('[UserAuthentication] User is authenticated');
          return true;
        } else {
          loggerService.debug(
            '[UserAuthentication] User is not authenticated. Redirecting to login page.',
          );
          return router.parseUrl('/auth/login');
        }
      }),
    );
  };
}
