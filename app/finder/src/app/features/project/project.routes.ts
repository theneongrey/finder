import { Routes } from '@angular/router';
import { ActivatedRouteSnapshot } from '@angular/router';
import { OptionType } from './_models/project-detail.model';

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
    path: 'add-standalone',
    loadComponent: () =>
      import('./standalone-topic-shell/standalone-topic-shell.component').then(
        (m) => m.StandalonePollShellComponent,
      ),
    data: {
      backRoute: '/project/',
    },
  },
  {
    path: 'detail/:projectId',
    loadComponent: () =>
      import('./details/details-shell.component').then(
        (m) => m.ProjectDetailShellComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./details/detail/project-detail.component').then(
            (m) => m.ProjectDetailComponent,
          ),
        data: {
          backRoute: '/project/',
        },
      },
      {
        path: 'poll/add',
        loadComponent: () =>
          import('./details/topic-input/topic-input.component').then(
            (m) => m.TopicInputComponent,
          ),
        data: {
          mode: 'add',
          backRoute: (s: ActivatedRouteSnapshot) =>
            `/project/detail/${s.parent?.params['projectId']}`,
        },
      },
      {
        path: 'poll/edit/yesno/:pollId',
        loadComponent: () =>
          import('./details/topic-input/topic-input.component').then(
            (m) => m.TopicInputComponent,
          ),
        data: {
          mode: 'edit',
          optionType: OptionType.YesNo,
          backRoute: (s: ActivatedRouteSnapshot) =>
            `/project/detail/${s.parent?.params['projectId']}`,
        },
      },
      {
        path: 'poll/edit/rating/:pollId',
        loadComponent: () =>
          import('./details/topic-input/topic-input.component').then(
            (m) => m.TopicInputComponent,
          ),
        data: {
          mode: 'edit',
          optionType: OptionType.Rating,
          backRoute: (s: ActivatedRouteSnapshot) =>
            `/project/detail/${s.parent?.params['projectId']}`,
        },
      },
      {
        path: 'poll/edit/date/:pollId',
        loadComponent: () =>
          import('./details/topic-input/topic-input.component').then(
            (m) => m.TopicInputComponent,
          ),
        data: {
          mode: 'edit',
          optionType: OptionType.Date,
          backRoute: (s: ActivatedRouteSnapshot) =>
            `/project/detail/${s.parent?.params['projectId']}`,
        },
      },
      {
        path: 'vote/:pollId/:optionId',
        loadComponent: () =>
          import('./details/vote/project-vote.component').then(
            (m) => m.ProjectVoteComponent,
          ),
        data: {
          backRoute: (s: ActivatedRouteSnapshot) =>
            `/project/detail/${s.parent?.params['projectId']}`,
        },
      },
      {
        path: 'vote/:pollId',
        loadComponent: () =>
          import('./details/vote/project-vote.component').then(
            (m) => m.ProjectVoteComponent,
          ),
        data: {
          backRoute: (s: ActivatedRouteSnapshot) =>
            `/project/detail/${s.parent?.params['projectId']}`,
        },
      },
      {
        path: 'votes-overview/:pollId',
        loadComponent: () =>
          import('./details/votes-overview/votes-overview.component').then(
            (m) => m.VotesOverviewComponent,
          ),
        data: {
          backRoute: (s: ActivatedRouteSnapshot) =>
            `/project/detail/${s.parent?.params['projectId']}`,
        },
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'overview',
    pathMatch: 'full',
  },
];
