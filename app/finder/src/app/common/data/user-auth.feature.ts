import { inject } from '@angular/core';
import {
    patchState,
    signalStoreFeature,
    withMethods,
    withProps,
    withState,
} from '@ngrx/signals';
import {
    catchError,
    distinctUntilChanged,
    EMPTY,
    filter,
    pipe,
    switchMap,
    tap,
} from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { LoggerService } from '../services/logger.service';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { User } from '../models/user.model';
import { UserService } from '../services/user.service';

/** Why the last code login failed. */
export type CodeLoginError = 'invalid' | 'rate-limited' | 'error';

/** Wrong codes the backend accepts before it voids the code (LoginService.MaxRetries). */
export const MAX_CODE_ATTEMPTS = 3;

const CODE_LOGIN_RESET = {
    codeLoginFailures: 0,
    codeLoginRejections: 0,
    codeLoginError: undefined as CodeLoginError | undefined,
};

export function withAuthFeature() {
    return signalStoreFeature(
        withState({
            redirectUrl: undefined as string | undefined,
            user: undefined as User | undefined,
            loginMail: {
                state: 'init' as
                    | 'init'
                    | 'sent'
                    | 'finished'
                    | 'error'
                    | 'forbidden'
                    | 'rate-limiter',
                email: undefined as string | undefined,
            },
            /** Failed code logins for the current login mail (any reason); each increment is one failure. */
            codeLoginFailures: 0,
            /** Codes the backend rejected as wrong (401) for the current login mail. */
            codeLoginRejections: 0,
            codeLoginError: undefined as CodeLoginError | undefined,
        }),
        withProps(() => ({
            userService: inject(UserService),
            loggerService: inject(LoggerService),
        })),
        withMethods((store) => {
            const handleGetUser = store.userService.getUser().pipe(
                tapResponse({
                    next: (user) => {
                        store.loggerService.debug(
                            '[UserStore] patching user',
                            user,
                        );
                        patchState(store, { user });
                    },
                    error: (error) => {
                        patchState(store, { user: undefined });
                        store.loggerService.error(
                            '[UserStore] Error while loading user',
                            error,
                        );
                    },
                }),
            );

            return {
                setRedirectUrl(redirectUrl: string | undefined) {
                    if (redirectUrl?.startsWith('/auth')) {
                        redirectUrl = undefined;
                    }
                    store.loggerService.debug(
                        `[UserStore] updating redirect url ${redirectUrl}`,
                    );
                    patchState(store, { redirectUrl });
                },

                resetLoginMail() {
                    patchState(store, {
                        loginMail: { email: undefined, state: 'init' },
                        ...CODE_LOGIN_RESET,
                    });
                },

                getUser: rxMethod<void>(pipe(switchMap(() => handleGetUser))),

                requestLoginMail: rxMethod<string>(
                    pipe(
                        tap((email) =>
                            patchState(store, {
                                loginMail: {
                                    ...store.loginMail(),
                                    state: 'sent',
                                    email,
                                },
                                ...CODE_LOGIN_RESET,
                            }),
                        ),
                        switchMap((email) => {
                            return store.userService
                                .requestLoginMail(email, store.redirectUrl())
                                .pipe(
                                    tapResponse({
                                        next: () =>
                                            patchState(store, {
                                                loginMail: {
                                                    ...store.loginMail(),
                                                    state: 'finished',
                                                },
                                            }),
                                        error: (error: HttpErrorResponse) => {
                                            switch (error.status) {
                                                case 401:
                                                    patchState(store, {
                                                        loginMail: {
                                                            ...store.loginMail(),
                                                            state: 'forbidden',
                                                        },
                                                    });
                                                    break;
                                                case 429:
                                                    patchState(store, {
                                                        loginMail: {
                                                            ...store.loginMail(),
                                                            state: 'rate-limiter',
                                                        },
                                                    });
                                                    break;
                                                default:
                                                    patchState(store, {
                                                        loginMail: {
                                                            email: undefined,
                                                            state: 'error',
                                                        },
                                                    });
                                            }

                                            store.loggerService.error(
                                                '[UserStore] Error requesting login mail',
                                                error,
                                            );
                                        },
                                    }),
                                );
                        }),
                    ),
                ),

                loginByToken: rxMethod<string>(
                    pipe(
                        distinctUntilChanged(),
                        filter((loginToken) => !!loginToken),
                        switchMap((loginToken) => {
                            return store.userService
                                .loginByToken(loginToken)
                                .pipe(
                                    switchMap((redirectUrl) => {
                                        if (redirectUrl) {
                                            patchState(store, { redirectUrl });
                                        }
                                        return handleGetUser;
                                    }),
                                    catchError((error) => {
                                        store.loggerService.log(
                                            '[UserStore] Error while logging in with token',
                                            error,
                                        );
                                        return EMPTY;
                                    }),
                                );
                        }),
                    ),
                ),

                loginByCode: rxMethod<string>(
                    pipe(
                        filter(
                            (loginCode) =>
                                !!store.loginMail.email() && !!loginCode,
                        ),
                        switchMap((loginCode) => {
                            return store.userService
                                .loginByCode(
                                    store.loginMail.email()!,
                                    loginCode,
                                )
                                .pipe(
                                    switchMap((redirectUrl) => {
                                        store.loggerService.debug(
                                            `[UserStore] Login successful redirecting to ${redirectUrl}`,
                                        );
                                        if (redirectUrl) {
                                            patchState(store, { redirectUrl });
                                        }
                                        return handleGetUser;
                                    }),
                                    catchError((error: HttpErrorResponse) => {
                                        const rejected = error.status === 401;
                                        patchState(store, {
                                            codeLoginFailures:
                                                store.codeLoginFailures() + 1,
                                            codeLoginRejections:
                                                store.codeLoginRejections() +
                                                (rejected ? 1 : 0),
                                            codeLoginError: rejected
                                                ? 'invalid'
                                                : error.status === 429
                                                  ? 'rate-limited'
                                                  : 'error',
                                        });
                                        store.loggerService.error(
                                            '[UserStore] Error while logging in with code',
                                            error,
                                        );
                                        return EMPTY;
                                    }),
                                );
                        }),
                    ),
                ),

                logout: rxMethod<void>(
                    pipe(
                        switchMap(() =>
                            store.userService.logout().pipe(
                                tapResponse({
                                    next: () => {
                                        patchState(store, {
                                            user: undefined,
                                            loginMail: {
                                                email: undefined,
                                                state: 'init',
                                            },
                                            redirectUrl: undefined,
                                        });
                                    },
                                    error: (error) => {
                                        patchState(store, {
                                            user: undefined,
                                            loginMail: {
                                                email: undefined,
                                                state: 'init',
                                            },
                                            redirectUrl: undefined,
                                        });
                                        store.loggerService.error(
                                            '[UserStore] Error while logging out',
                                            error,
                                        );
                                    },
                                }),
                            ),
                        ),
                    ),
                ),
            };
        }),
    );
}
