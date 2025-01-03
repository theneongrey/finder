import {
  patchState,
  signalStore,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { inject } from '@angular/core';
import { LoggerService } from '../../../common/services/logger.service';

export const ProjectStore = signalStore(
  { providedIn: 'root' },
  withState({}),
  withProps(() => {
    return {
      loggerService: inject(LoggerService),
    };
  }),
  withMethods((store) => ({})),
);
