import { Routes } from '@angular/router';
import { OptionType } from '../../../common/models/option-type.model';

export const detailRoutes: Routes = [
    {
        path: '',
        redirectTo: '/polls',
        pathMatch: 'full',
    },
    {
        path: 'poll/edit/yesno/:pollId',
        loadComponent: () =>
            import('./edit/edit-poll.component').then(
                (m) => m.EditPollComponent,
            ),
        data: {
            optionType: OptionType.YesNo,
            backRoute: '/polls',
        },
    },
    {
        path: 'poll/edit/rating/:pollId',
        loadComponent: () =>
            import('./edit/edit-poll.component').then(
                (m) => m.EditPollComponent,
            ),
        data: {
            optionType: OptionType.Rating,
            backRoute: '/polls',
        },
    },
    {
        path: 'poll/edit/date/:pollId',
        loadComponent: () =>
            import('./edit/edit-poll.component').then(
                (m) => m.EditPollComponent,
            ),
        data: {
            optionType: OptionType.Date,
            backRoute: '/polls',
        },
    },
    {
        path: 'vote/:pollId/:optionId',
        loadComponent: () =>
            import('./vote/project-vote.component').then(
                (m) => m.ProjectVoteComponent,
            ),
        data: {
            backRoute: '/polls',
        },
    },
    {
        path: 'vote/:pollId',
        loadComponent: () =>
            import('./vote/project-vote.component').then(
                (m) => m.ProjectVoteComponent,
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
