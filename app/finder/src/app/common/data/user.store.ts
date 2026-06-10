import {
  patchState,
  signalStore,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { inject } from '@angular/core';
import { User } from '../models/user.model';
import { UserService } from '../services/user.service';
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
import { Router } from '@angular/router';

export const UserStore = signalStore(
  { providedIn: 'root' },
  withState({
    redirectUrl: undefined as string | undefined,
    user: undefined as User | undefined,
    loginMail: {
      state: 'init' as 'init' | 'sent' | 'finished' | 'error' | 'forbidden',
      email: undefined as string | undefined,
    },
  }),
  withProps(() => ({
    userService: inject(UserService),
    loggerService: inject(LoggerService),
    router: inject(Router),
  })),
  withMethods((store) => {
    const handleGetUser = store.userService.getUser().pipe(
      tapResponse({
        next: (user) => {
          store.loggerService.debug('[UserStore] patching user', user);
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
        store.loggerService.debug(
          `[UserStore] updating redirect url ${redirectUrl}`,
        );
        patchState(store, { redirectUrl });
      },

      getUser: rxMethod<void>(pipe(switchMap(() => handleGetUser))),

      requestLoginMail: rxMethod<string>(
        pipe(
          distinctUntilChanged(),
          tap((email) =>
            patchState(store, {
              loginMail: {
                ...store.loginMail(),
                state: 'sent',
                email,
              },
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
                    if (error.status === 401) {
                      patchState(store, {
                        loginMail: {
                          ...store.loginMail(),
                          state: 'forbidden',
                        },
                      });
                    } else {
                      patchState(store, {
                        loginMail: {
                          email: undefined,
                          state: 'error',
                        },
                      });
                      store.loggerService.error(
                        '[UserStore] Error requesting login mail',
                        error,
                      );
                    }
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
            return store.userService.loginByToken(loginToken).pipe(
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
          distinctUntilChanged(),
          filter((loginCode) => !!store.loginMail.email() && !!loginCode),
          switchMap((loginCode) => {
            return store.userService
              .loginByCode(store.loginMail.email()!, loginCode)
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
                catchError((error) => {
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

      updateName: rxMethod<string>(
        pipe(
          distinctUntilChanged(),
          filter((name) => !!store.user()?.isAuthenticated && !!name),
          switchMap((name) => {
            return store.userService.updateName(name).pipe(
              tapResponse({
                next: (user) => patchState(store, { user }),
                error: (error) => {
                  store.loggerService.error(
                    '[UserStore] Error while updating the name',
                    error,
                  );
                },
              }),
            );
          }),
        ),
      ),

      logout: rxMethod<void>(
        pipe(
          switchMap(() => {
            return store.userService.logout().pipe(
              tapResponse({
                next: () => {
                  /* no action */
                },
                error: (error) => {
                  store.loggerService.error(
                    '[UserStore] Error while logging out',
                    error,
                  );
                },
                finalize: () => {
                  patchState(store, { user: undefined });
                  location.reload();
                },
              }),
            );
          }),
        ),
      ),
    };
  }),
);
