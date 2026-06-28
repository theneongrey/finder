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
        path: 'topic/add/yesno',
        loadComponent: () =>
          import('./details/topic-input/topic-input.component').then(
            (m) => m.TopicInputComponent,
          ),
        data: {
          mode: 'add',
          optionType: OptionType.YesNo,
          backRoute: (s: ActivatedRouteSnapshot) =>
            `/project/detail/${s.parent?.params['projectId']}`,
        },
      },
      {
        path: 'topic/edit/yesno/:topicId',
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
        path: 'topic/add/rating',
        loadComponent: () =>
          import('./details/topic-input/topic-input.component').then(
            (m) => m.TopicInputComponent,
          ),
        data: {
          mode: 'add',
          optionType: OptionType.Rating,
          backRoute: (s: ActivatedRouteSnapshot) =>
            `/project/detail/${s.parent?.params['projectId']}`,
        },
      },
      {
        path: 'topic/edit/rating/:topicId',
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
        path: 'topic/add/date',
        loadComponent: () =>
          import('./details/topic-input/topic-input.component').then(
            (m) => m.TopicInputComponent,
          ),
        data: {
          mode: 'add',
          optionType: OptionType.Date,
          backRoute: (s: ActivatedRouteSnapshot) =>
            `/project/detail/${s.parent?.params['projectId']}`,
        },
      },
      {
        path: 'topic/edit/date/:topicId',
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
        path: 'vote/:topicId/:optionId',
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
        path: 'vote/:topicId',
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
        path: 'votes-overview/:topicId',
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
