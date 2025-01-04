import { ActivatedRoute, CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { UserService } from './user.service';
import { UserStore } from '../data/user.store';

export function userAuthentication(): CanActivateFn {
  return (route) => {
    const userService = inject(UserService);
    const router = inject(Router);

    return userService.getUser().pipe(
      map((user) => {
        if (user?.isAuthenticated) {
          return true;
        } else {
          return router.parseUrl('/auth/login');
        }
      }),
    );
    /*

 */
  };
}
