import { Routes } from '@angular/router';

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
    data: { backRoute: '/logout' },
  },
  {
    path: 'token-login',
    loadComponent: () =>
      import('./token-login/token-login.component').then(
        (m) => m.TokenLoginComponent,
      ),
  },
  {
    path: 'login-success',
    loadComponent: () =>
      import('./login-success/login-success.component').then(
        (m) => m.LoginSuccessComponent,
      ),
  },
];
