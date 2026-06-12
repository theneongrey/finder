import { Routes } from '@angular/router';
import { userAuthentication } from './common/services/auth.guard';
import { authRoutes } from './features/auth/auth.routes';
import { projectRoutes } from './features/project/project.routes';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'logged-in',
    redirectTo: 'project',
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/shell.component').then(
        (m) => m.AuthShellComponent,
      ),
    children: authRoutes,
  },
  {
    canActivate: [userAuthentication()],
    path: 'project',
    loadComponent: () =>
      import('./features/project/shell.component').then(
        (m) => m.ProjectShellComponent,
      ),
    children: projectRoutes,
  },
  {
    canActivate: [userAuthentication()],
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings.component').then(
        (m) => m.SettingsComponent,
      ),
  },
];
