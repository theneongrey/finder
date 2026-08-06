import { Routes } from '@angular/router';
import { selectedRoutes } from './selected/selected.routes';

export const projectRoutes: Routes = [
  {
    path: 'overview',
    loadComponent: () =>
      import('./overview/project-overview.component').then(
        (m) => m.ProjectOverviewComponent,
      ),
  },
  {
    path: 'add-standalone',
    loadComponent: () =>
      import('./standalone-poll-input-wrapper/standalone-poll-input-wrapper.component').then(
        (m) => m.StandalonePollInputWrapperComponent,
      ),
    data: {
      backRoute: '/project/',
    },
  },
  {
    path: 'detail/:projectId',
    loadComponent: () =>
      import('./selected/selected-shell.component').then(
        (m) => m.ProjectSelectedShellComponent,
      ),
    children: selectedRoutes,
  },
  {
    path: '**',
    redirectTo: 'overview',
    pathMatch: 'full',
  },
];
