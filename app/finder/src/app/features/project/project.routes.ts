import { Routes } from '@angular/router';

export const projectRoutes: Routes = [
  {
    path: 'overview',
    loadComponent: () =>
      import('./overview/project-overview.component').then(
        (m) => m.ProjectOverviewComponent,
      ),
  },
  {
    path: 'detail/:id/:action',
    loadComponent: () =>
      import('./detail/project-detail.component').then(
        (m) => m.ProjectDetailComponent,
      ),
  },
  {
    path: 'detail/:id/vote/:topicId/:optionId',
    loadComponent: () =>
      import('./vote/project-vote.component').then(
        (m) => m.ProjectVoteComponent,
      ),
  },
  {
    path: 'detail/:id/vote/:topicId',
    loadComponent: () =>
      import('./vote/project-vote.component').then(
        (m) => m.ProjectVoteComponent,
      ),
  },
  {
    path: 'detail/:id/topic/:topicId/:action',
    loadComponent: () =>
      import('./topic/project-topic.component').then(
        (m) => m.ProjectTopicComponent,
      ),
  },
  {
    path: 'detail/:id/topic/:topicId',
    loadComponent: () =>
      import('./topic/project-topic.component').then(
        (m) => m.ProjectTopicComponent,
      ),
  },
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('./detail/project-detail.component').then(
        (m) => m.ProjectDetailComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'overview',
    pathMatch: 'full',
  },
];
