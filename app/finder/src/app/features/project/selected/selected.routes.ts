import { Routes } from '@angular/router';
import { ActivatedRouteSnapshot } from '@angular/router';

export const selectedRoutes: Routes = [
  {
    path: '',
    redirectTo: '/project/overview',
    pathMatch: 'full',
  },
  {
    path: 'vote/:pollId/:optionId',
    loadComponent: () =>
      import('./vote/project-vote.component').then(
        (m) => m.ProjectVoteComponent,
      ),
    data: {
      backRoute: (s: ActivatedRouteSnapshot) =>
        `/project/poll/${s.parent?.params['projectId']}/poll-overview/${s.params['pollId']}`,
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
        `/project/poll/${s.parent?.params['projectId']}/poll-overview/${s.params['pollId']}`,
    },
  },
  {
    path: 'results/:pollId',
    loadComponent: () =>
      import('./results/results.component').then((m) => m.ResultsComponent),
    data: {
      backRoute: (s: ActivatedRouteSnapshot) =>
        `/project/poll/${s.parent?.params['projectId']}/poll-overview/${s.params['pollId']}`,
    },
  },
  {
    path: 'poll-overview/:pollId',
    loadComponent: () =>
      import('./poll-overview/poll-overview.component').then(
        (m) => m.PollOverviewComponent,
      ),
    data: {
      backRoute: '/project/overview',
    },
  },
];
