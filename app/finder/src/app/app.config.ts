import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { AppTheme } from './common/theme/ngpime.preset';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()), //, withDebugTracing()),
    provideHttpClient(),
    providePrimeNG({
      theme: {
        preset: AppTheme,
      },
    }),
  ],
};
