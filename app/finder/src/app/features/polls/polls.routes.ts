import { Routes } from '@angular/router';
import { detailRoutes } from './detail/detail.routes';

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
        path: ':id',
        loadComponent: () =>
            import('./detail/detail-shell.component').then(
                (m) => m.PollDetailShellComponent,
            ),
        children: detailRoutes,
    },
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full',
    },
];
