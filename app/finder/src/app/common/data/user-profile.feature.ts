import { inject } from '@angular/core';
import {
    patchState,
    signalStoreFeature,
    type,
    withMethods,
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
        withMethods((store) => {
            const userService = inject(UserService);
            const loggerService = inject(LoggerService);
            const dispatcher = inject(Dispatcher);

            return {
                updateProfile: rxMethod<{ name: string; language: string }>(
                    pipe(
                        filter(
                            ({ name }) =>
                                !!store.user()?.isAuthenticated && !!name,
                        ),
                        switchMap(({ name, language }) => {
                            return userService
                                .updateProfile(name, language)
                                .pipe(
                                    tapResponse({
                                        next: (user) => {
                                            patchState(store, { user });
                                            localStorage.setItem(
                                                LANGUAGE_STORAGE_KEY,
                                                language,
                                            );
                                            dispatcher.dispatch(
                                                profileUpdateFinished({
                                                    success: true,
                                                }),
                                            );
                                        },
                                        error: (error) => {
                                            loggerService.error(
                                                '[UserStore] Error while updating the profile',
                                                error,
                                            );
                                            dispatcher.dispatch(
                                                profileUpdateFinished({
                                                    success: false,
                                                }),
                                            );
                                        },
                                    }),
                                );
                        }),
                    ),
                ),
            };
        }),
    );
}
