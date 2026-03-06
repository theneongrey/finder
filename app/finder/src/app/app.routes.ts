import { Routes } from '@angular/router';
import { userAuthentication } from './common/services/auth.guard';
import { authRoutes } from './features/auth/shell/auth-shell.routes';

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
    canActivate: [userAuthentication()],
    path: 'project',
    loadComponent: () =>
      import('./features/project/project.component').then(
        (m) => m.ProjectComponent,
      ),
    children: [
      {
        path: 'overview',
        loadComponent: () =>
          import('./features/project/overview/project-overview.component').then(
            (m) => m.ProjectOverviewComponent,
          ),
      },
      {
        path: 'detail/:id/:action',
        loadComponent: () =>
          import('./features/project/detail/project-detail.component').then(
            (m) => m.ProjectDetailComponent,
          ),
      },
      {
        path: 'detail/:id/vote/:topicId/:optionId',
        loadComponent: () =>
          import('./features/project/vote/project-vote.component').then(
            (m) => m.ProjectVoteComponent,
          ),
      },
      {
        path: 'detail/:id/vote/:topicId',
        loadComponent: () =>
          import('./features/project/vote/project-vote.component').then(
            (m) => m.ProjectVoteComponent,
          ),
      },
      {
        path: 'detail/:id/topic/:topicId/:action',
        loadComponent: () =>
          import('./features/project/topic/project-topic.component').then(
            (m) => m.ProjectTopicComponent,
          ),
      },
      {
        path: 'detail/:id/topic/:topicId',
        loadComponent: () =>
          import('./features/project/topic/project-topic.component').then(
            (m) => m.ProjectTopicComponent,
          ),
      },
      {
        path: 'detail/:id',
        loadComponent: () =>
          import('./features/project/detail/project-detail.component').then(
            (m) => m.ProjectDetailComponent,
          ),
      },
      {
        path: '**',
        redirectTo: 'overview',
        pathMatch: 'full',
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
    loadComponent: () =>
      import('./features/auth/shell/auth-shell.component').then(
        (m) => m.AuthShellComponent,
      ),
    children: authRoutes,
  },
];
