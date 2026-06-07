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
    path: 'add',
    loadComponent: () =>
      import('./project-input/project-input.component').then(
        (m) => m.ProjectInputComponent,
      ),
    data: {
      mode: 'add',
    },
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./project-input/project-input.component').then(
        (m) => m.ProjectInputComponent,
      ),
    data: {
      mode: 'edit',
    },
  },
  {
    path: 'detail/:id/topic/add/yesno',
    loadComponent: () =>
      import('./topic-input-yes-no/topic-input-yes-no.component').then(
        (m) => m.TopicInputYesNoComponent,
      ),
    data: {
      mode: 'add',
    },
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
    path: 'detail/:id/votes-overview/:topicId',
    loadComponent: () =>
      import('./votes-overview/votes-overview.component').then(
        (m) => m.VotesOverviewComponent,
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
