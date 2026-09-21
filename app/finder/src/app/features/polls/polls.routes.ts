import { Routes } from '@angular/router';

export const pollsRoutes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./overview/polls-overview.component').then(
                (m) => m.PollsOverviewComponent,
            ),
        pathMatch: 'full',
    },
    {
        path: 'add',
        loadComponent: () =>
            import('./add/add-poll.component').then((m) => m.AddPollComponent),
        data: {
            backRoute: '/polls',
        },
    },
    {
        path: ':id/:pollId',
        loadComponent: () =>
            import('./detail/detail-shell.component').then(
                (m) => m.PollDetailShellComponent,
            ),
    },
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full',
    },
];
