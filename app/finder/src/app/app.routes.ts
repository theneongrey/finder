import { Routes } from '@angular/router';
import { userAuthentication } from './common/services/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'projects',
    pathMatch: 'full',
  },
  {
    canActivate: [userAuthentication()],
    path: 'projects',
    loadComponent: () =>
      import('./features/project/project.component').then(
        (m) => m.ProjectComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/project/overview/project-overview.component').then(
            (m) => m.ProjectOverviewComponent,
          ),
      },
    ],
  },
  {
    canActivate: [userAuthentication()],
    path: 'settings',
    children: [
      {
        path: 'set-name',
        loadComponent: () =>
          import('./features/settings/set-name/set-name.component').then(
            (m) => m.SetNameComponent,
          ),
      },
    ],
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
        path: 'token-login',
        loadComponent: () =>
          import('./features/auth/token-login/token-login.component').then(
            (m) => m.TokenLoginComponent,
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
