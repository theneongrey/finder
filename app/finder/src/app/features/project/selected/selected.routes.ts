import { Routes } from '@angular/router';
import { ActivatedRouteSnapshot } from '@angular/router';
import { OptionType } from '../_shared/models/project-detail.model';

export const selectedRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./detail/project-detail.component').then(
        (m) => m.ProjectDetailComponent,
      ),
    data: {
      backRoute: '/project/',
    },
  },
  {
    path: 'poll/add',
    loadComponent: () =>
      import('../_shared/ui/poll-input/poll-input.component').then(
        (m) => m.PollInputComponent,
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
      import('../_shared/ui/poll-input/poll-input.component').then(
        (m) => m.PollInputComponent,
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
      import('../_shared/ui/poll-input/poll-input.component').then(
        (m) => m.PollInputComponent,
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
      import('../_shared/ui/poll-input/poll-input.component').then(
        (m) => m.PollInputComponent,
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
      import('./vote/project-vote.component').then(
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
      import('./vote/project-vote.component').then(
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
      import('./votes-overview/votes-overview.component').then(
        (m) => m.VotesOverviewComponent,
      ),
    data: {
      backRoute: (s: ActivatedRouteSnapshot) =>
        `/project/detail/${s.parent?.params['projectId']}`,
    },
  },
];
