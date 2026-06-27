import { Routes } from '@angular/router';
import { userAuthentication } from '../../common/services/auth.guard';

export const authRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'request-email',
    loadComponent: () =>
      import('./request-email/request-email.component').then(
        (m) => m.RequestEmailComponent,
      ),
    data: { backRoute: '/' },
  },
  {
    path: 'code-login',
    loadComponent: () =>
      import('./code-login/code-login.component').then(
        (m) => m.CodeLoginComponent,
      ),
    data: { backRoute: '/project' },
  },
  {
    path: 'token-login',
    loadComponent: () =>
      import('./token-login/token-login.component').then(
        (m) => m.TokenLoginComponent,
      ),
  },
  {
    canActivate: [userAuthentication()],
    path: 'logout',
    loadComponent: () =>
      import('./logout/logout.component').then((m) => m.LogoutComponent),
  },
];
