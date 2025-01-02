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
import { distinctUntilChanged, filter, of, pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { LoggerService } from '../services/logger.service';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

export const UserStore = signalStore(
  { providedIn: 'root' },
  withState({
    redirectUrl: undefined as string | undefined,
    user: undefined as User | undefined,
    loginRequestEmailWasSent: false,
    loginMail: undefined as string | undefined,
  }),
  withProps(() => ({
    userService: inject(UserService),
    loggerService: inject(LoggerService),
  })),
  withMethods((store) => {
    const handleGetUser = store.userService.getUser().pipe(
      tapResponse({
        next: (user) => patchState(store, { user }),
        error: (error) => {
          patchState(store, { user: undefined });
          store.loggerService.log('Error while loading user', error);
        },
      }),
    );

    return {
      setRedirectUrl(redirectUrl: string | undefined) {
        patchState(store, { redirectUrl });
      },

      getUser: rxMethod<void>(pipe(switchMap(() => handleGetUser))),

      requestLoginMail: rxMethod<string>(
        pipe(
          distinctUntilChanged(),
          tap((email) => patchState(store, { loginMail: email })),
          switchMap((email) => {
            return store.userService
              .requestLoginMail(email, store.redirectUrl())
              .pipe(
                tapResponse({
                  next: () =>
                    patchState(store, { loginRequestEmailWasSent: true }),
                  error: (error) => {
                    patchState(store, { loginMail: undefined });
                    store.loggerService.log(
                      'Error requestimg login mail',
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
            return store.userService.loginByToken(loginToken).pipe(
              tapResponse({
                next: (redirectUrl) => {
                  if (redirectUrl) {
                    patchState(store, { redirectUrl });
                  }
                },
                error: (error) => {
                  store.loggerService.log(
                    'Error while logging in with token',
                    error,
                  );
                },
              }),
              switchMap(() => handleGetUser),
            );
          }),
        ),
      ),

      loginByCode: rxMethod<string>(
        pipe(
          distinctUntilChanged(),
          filter((loginCode) => !!store.loginMail() && !!loginCode),
          switchMap((loginCode) => {
            return store.userService
              .loginByCode(store.loginMail()!, loginCode)
              .pipe(
                tapResponse({
                  next: (redirectUrl) => {
                    if (redirectUrl) {
                      patchState(store, { redirectUrl });
                    }
                  },
                  error: (error) => {
                    store.loggerService.log(
                      'Error while logging in with code',
                      error,
                    );
                  },
                }),
                switchMap(() => handleGetUser),
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
                  store.loggerService.log(
                    'Error while updating the name',
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
                next: () => {},
                error: (error) => {
                  store.loggerService.log('Error while logging out', error);
                },
                finalize: () => patchState(store, { user: undefined }),
              }),
            );
          }),
        ),
      ),
    };
  }),
);
