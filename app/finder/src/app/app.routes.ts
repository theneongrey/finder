import { Routes } from '@angular/router';
import { userAuthentication } from './common/services/auth.guard';
import { ProjectTopicComponent } from './features/project/topic/project-topic.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'project',
    pathMatch: 'full',
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
        canActivate: [userAuthentication()],
        path: 'logout',
        loadComponent: () =>
          import('./features/auth/logout/logout.component').then(
            (m) => m.LogoutComponent,
          ),
      },
    ],
  },
];
