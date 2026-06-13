import { inject } from '@angular/core';
import {
  patchState,
  signalStoreFeature,
  type,
  withMethods,
  withProps,
} from '@ngrx/signals';
import { filter, pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Dispatcher, event } from '@ngrx/signals/events';
import { LoggerService } from '../services/logger.service';
import { User } from '../models/user.model';
import { UserService } from '../services/user.service';
import { LANGUAGE_STORAGE_KEY } from '../i18n/languages';

export const profileUpdateFinished = event(
  '[User Profile] Update Finished',
  type<{ success: boolean }>(),
);

export function withProfileFeature() {
  return signalStoreFeature(
    { state: type<{ user: User | undefined }>() },
    withProps(() => ({
      userService: inject(UserService),
      loggerService: inject(LoggerService),
      dispatcher: inject(Dispatcher),
    })),
    withMethods((store) => ({
      updateProfile: rxMethod<{ name: string; language: string }>(
        pipe(
          filter(({ name }) => !!store.user()?.isAuthenticated && !!name),
          switchMap(({ name, language }) => {
            return store.userService.updateProfile(name, language).pipe(
              tapResponse({
                next: (user) => {
                  patchState(store, { user });
                  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
                  store.dispatcher.dispatch(
                    profileUpdateFinished({ success: true }),
                  );
                },
                error: (error) => {
                  store.loggerService.error(
                    '[UserStore] Error while updating the profile',
                    error,
                  );
                  store.dispatcher.dispatch(
                    profileUpdateFinished({ success: false }),
                  );
                },
              }),
            );
          }),
        ),
      ),
    })),
  );
}
