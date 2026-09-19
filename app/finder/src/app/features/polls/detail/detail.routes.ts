import { Routes } from '@angular/router';

export const detailRoutes: Routes = [
    {
        path: '',
        redirectTo: '/polls',
        pathMatch: 'full',
    },
    {
        path: 'vote/:pollId/:optionId',
        loadComponent: () =>
            import('./vote/poll-vote.component').then(
                (m) => m.PollVoteComponent,
            ),
        data: {
            backRoute: '/polls',
        },
    },
    {
        path: 'vote/:pollId',
        loadComponent: () =>
            import('./vote/poll-vote.component').then(
                (m) => m.PollVoteComponent,
            ),
        data: {
            backRoute: '/polls',
        },
    },
    {
        path: 'results/:pollId',
        loadComponent: () =>
            import('./results/results.component').then(
                (m) => m.ResultsComponent,
            ),
        data: {
            backRoute: '/polls',
        },
    },
];
