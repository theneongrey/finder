import { Routes } from '@angular/router';
import { ActivatedRouteSnapshot } from '@angular/router';

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
      backRoute: '/project/',
    },
  },
  {
    path: 'edit/:projectId',
    loadComponent: () =>
      import('./project-input/project-input.component').then(
        (m) => m.ProjectInputComponent,
      ),
    data: {
      mode: 'edit',
      backRoute: '/project/',
    },
  },
  {
    path: 'detail/:projectId/topic/add/yesno',
    loadComponent: () =>
      import('./topic-input-yes-no/topic-input-yes-no.component').then(
        (m) => m.TopicInputYesNoComponent,
      ),
    data: {
      mode: 'add',
      backRoute: (s: ActivatedRouteSnapshot) => `/project/detail/${s.params['projectId']}`,
    },
  },
  {
    path: 'detail/:projectId/topic/edit/yesno/:topicId',
    loadComponent: () =>
      import('./topic-input-yes-no/topic-input-yes-no.component').then(
        (m) => m.TopicInputYesNoComponent,
      ),
    data: {
      mode: 'edit',
      backRoute: (s: ActivatedRouteSnapshot) => `/project/detail/${s.params['projectId']}`,
    },
  },
  {
    path: 'detail/:projectId/vote/:topicId/:optionId',
    loadComponent: () =>
      import('./vote/project-vote.component').then(
        (m) => m.ProjectVoteComponent,
      ),
    data: {
      backRoute: (s: ActivatedRouteSnapshot) => `/project/detail/${s.params['projectId']}`,
    },
  },
  {
    path: 'detail/:projectId/vote/:topicId',
    loadComponent: () =>
      import('./vote/project-vote.component').then(
        (m) => m.ProjectVoteComponent,
      ),
    data: {
      backRoute: (s: ActivatedRouteSnapshot) => `/project/detail/${s.params['projectId']}`,
    },
  },
  {
    path: 'detail/:projectId/votes-overview/:topicId',
    loadComponent: () =>
      import('./votes-overview/votes-overview.component').then(
        (m) => m.VotesOverviewComponent,
      ),
    data: {
      backRoute: (s: ActivatedRouteSnapshot) => `/project/detail/${s.params['projectId']}`,
    },
  },
  {
    path: 'detail/:projectId',
    loadComponent: () =>
      import('./detail/project-detail.component').then(
        (m) => m.ProjectDetailComponent,
      ),
    data: {
      backRoute: '/project/',
    },
  },
  {
    path: '**',
    redirectTo: 'overview',
    pathMatch: 'full',
  },
];
