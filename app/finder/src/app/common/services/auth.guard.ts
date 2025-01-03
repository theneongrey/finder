import { ActivatedRoute, CanActivateFn, Router } from '@angular/router';
import { UserStore } from '../data/user.store';
import { inject } from '@angular/core';

export function userAuthentication(): CanActivateFn {
  return (route) => {
    const userStore = inject(UserStore);
    const router = inject(Router);
    const activatedRoute = inject(ActivatedRoute);

    if (userStore.user()?.isAuthenticated) {
      return true;
    } else {
      if (activatedRoute.snapshot.url.length > 0) {
        const currentPath = activatedRoute.snapshot.url[0].path;
        userStore.setRedirectUrl(currentPath);
      }

      router.navigate(['/auth/login']);
      return false;
    }
  };
}
