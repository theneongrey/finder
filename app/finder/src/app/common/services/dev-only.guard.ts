import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '../env/environment';

export const devOnly: CanActivateFn = () => {
  const router = inject(Router);
  if (environment.environment === 'development') {
    return true;
  }
  return router.parseUrl('/');
};
