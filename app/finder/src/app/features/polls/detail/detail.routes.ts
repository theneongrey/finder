import { Routes } from '@angular/router';
import { ActivatedRouteSnapshot } from '@angular/router';

export const detailRoutes: Routes = [
  {
    path: '',
    redirectTo: '/polls',
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
        `/polls/${s.parent?.params['id']}/overview/${s.params['pollId']}`,
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
        `/polls/${s.parent?.params['id']}/overview/${s.params['pollId']}`,
    },
  },
  {
    path: 'results/:pollId',
    loadComponent: () =>
      import('./results/results.component').then((m) => m.ResultsComponent),
    data: {
      backRoute: (s: ActivatedRouteSnapshot) =>
        `/polls/${s.parent?.params['id']}/overview/${s.params['pollId']}`,
    },
  },
  {
    path: 'overview/:pollId',
    loadComponent: () =>
      import('./overview/poll-overview.component').then(
        (m) => m.PollOverviewComponent,
      ),
    data: {
      backRoute: '/polls',
    },
  },
];
