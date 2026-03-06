import { Routes } from '@angular/router';
import { userAuthentication } from '../../../common/services/auth.guard';

export const authRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('../login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'request-email',
    loadComponent: () =>
      import('../auth-request-email/auth-request-email.component').then(
        (m) => m.AuthRequestEmailComponent,
      ),
  },
  {
    path: 'code-login',
    loadComponent: () =>
      import('../code-login/code-login.component').then(
        (m) => m.CodeLoginComponent,
      ),
  },
  {
    path: 'token-login',
    loadComponent: () =>
      import('../token-login/token-login.component').then(
        (m) => m.TokenLoginComponent,
      ),
  },
  {
    canActivate: [userAuthentication()],
    path: 'logout',
    loadComponent: () =>
      import('../logout/logout.component').then((m) => m.LogoutComponent),
  },
];
