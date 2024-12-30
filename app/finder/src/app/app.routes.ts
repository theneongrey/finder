import { Routes } from '@angular/router';
import { userAuthentication } from './common/services/auth.guard';

export const routes: Routes = [
  {
    canActivate: [userAuthentication()],
    path: '',
    loadComponent: () =>
      import('./features/project/project.component').then(
        (m) => m.ProjectComponent,
      ),
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(
            (m) => m.LoginComponent,
          ),
      },
      {
        path: 'request-email',
        loadComponent: () =>
          import(
            './features/auth/auth-request-email/auth-request-email.component'
          ).then((m) => m.AuthRequestEmailComponent),
      },
      {
        path: 'code-login',
        loadComponent: () =>
          import('./features/auth/code-login/code-login.component').then(
            (m) => m.CodeLoginComponent,
          ),
      },
      {
        path: 'logout',
        loadComponent: () =>
          import('./features/auth/logout/logout.component').then(
            (m) => m.LogoutComponent,
          ),
      },
    ],
  },
];
