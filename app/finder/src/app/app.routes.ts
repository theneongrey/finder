import { Routes } from '@angular/router';
import { userAuthentication } from './common/services/auth.guard';
import { devOnly } from './common/services/dev-only.guard';
import { authRoutes } from './features/auth/auth.routes';
import { pollsRoutes } from './features/polls/polls.routes';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/language-redirect.component').then(
        (m) => m.LanguageRedirectComponent,
      ),
    pathMatch: 'full',
  },
  {
    path: 'de',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
    data: { lang: 'de' },
  },
  {
    path: 'en',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
    data: { lang: 'en' },
  },
  {
    path: 'es',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
    data: { lang: 'es' },
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/shell.component').then(
        (m) => m.AuthShellComponent,
      ),
    children: authRoutes,
  },
  {
    path: 'logout',
    loadComponent: () =>
      import('./features/logout/logout.component').then(
        (m) => m.LogoutComponent,
      ),
  },
  {
    path: 'p/:projectId',
    loadComponent: () =>
      import('./features/polls/public/public-poll/public-poll.component').then(
        (m) => m.PublicPollComponent,
      ),
  },
  {
    canActivate: [devOnly],
    path: 'ux',
    loadComponent: () =>
      import('./features/design-system/design-system.component').then(
        (m) => m.DesignSystemComponent,
      ),
  },
  {
    canActivate: [userAuthentication()],
    path: 'polls',
    loadComponent: () =>
      import('./features/polls/polls-shell.component').then(
        (m) => m.PollsShellComponent,
      ),
    children: pollsRoutes,
  },
  {
    canActivate: [userAuthentication()],
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings.component').then(
        (m) => m.SettingsComponent,
      ),
    data: { backRoute: '/polls' },
  },
  {
    path: '**',
    redirectTo: '',
  },
];
