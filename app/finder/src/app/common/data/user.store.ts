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
    loginAttemptSuccessful: false,
  }),
  withProps(() => ({
    userService: inject(UserService),
    loggerService: inject(LoggerService),
  })),
  withMethods((store) => ({
    setRedirectUrl(redirectUrl: string) {
      patchState(store, { redirectUrl });
    },

    getUser: rxMethod<void>(
      pipe(
        switchMap(() => {
          return store.userService.getUser().pipe(
            tapResponse({
              next: (user) => patchState(store, { user }),
              error: (error) => {
                patchState(store, { user: undefined });
                store.loggerService.log('Error while loading user', error);
              },
            }),
          );
        }),
      ),
    ),

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
                  store.loggerService.log('Error requestimg login mail', error);
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
                patchState(store, { loginAttemptSuccessful: true });
              },
              error: (error) => {
                patchState(store, { loginAttemptSuccessful: false });
                store.loggerService.log(
                  'Error while logging in with token',
                  error,
                );
              },
            }),
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
                  patchState(store, { loginAttemptSuccessful: true });
                },
                error: (error) => {
                  patchState(store, { loginAttemptSuccessful: false });
                  store.loggerService.log(
                    'Error while logging in with code',
                    error,
                  );
                },
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
              next: () => patchState(store, { loginAttemptSuccessful: true }),
              error: (error) => {
                patchState(store, { loginAttemptSuccessful: false });
                store.loggerService.log(
                  'Error while logging in with code',
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
        switchMap((name) => {
          return store.userService.logout().pipe(
            tapResponse({
              next: () => patchState(store, { loginAttemptSuccessful: true }),
              error: (error) => {
                patchState(store, { loginAttemptSuccessful: false });
                store.loggerService.log(
                  'Error while logging in with code',
                  error,
                );
              },
            }),
          );
        }),
      ),
    ),
  })),
);
