import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { UserService } from './user.service';
import { LoggerService } from './logger.service';
import { UserStore } from '../data/user.store';

export function userAuthentication(): CanActivateFn {
  return (route, state) => {
    const userService = inject(UserService);
    const userStore = inject(UserStore);
    const router = inject(Router);
    const loggerService = inject(LoggerService);

    loggerService.debug(`[UserAuthentication] Trying to access ${state.url}`);

    return userService.getUser().pipe(
      map((user) => {
        if (user?.isAuthenticated) {
          loggerService.debug('[UserAuthentication] User is authenticated');
          return true;
        } else {
          userStore.setRedirectUrl(state.url);

          loggerService.debug(
            '[UserAuthentication] User is not authenticated. Redirecting to login page.',
          );
          return router.parseUrl('/auth/request-email');
        }
      }),
    );
  };
}
