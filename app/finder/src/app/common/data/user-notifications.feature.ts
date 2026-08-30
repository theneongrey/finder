import { inject } from '@angular/core';
import {
  patchState,
  signalStoreFeature,
  withMethods,
  withState,
} from '@ngrx/signals';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { LoggerService } from '../services/logger.service';
import {
  NotificationSetting,
  NotificationValue,
} from '../models/notification-setting.model';
import { UserService } from '../services/user.service';

export function withNotificationsFeature() {
  return signalStoreFeature(
    withState({
      notifications: [] as NotificationSetting[],
      notificationsLoading: false,
    }),
    withMethods((store) => {
      const userService = inject(UserService);
      const loggerService = inject(LoggerService);

      return {
        loadNotifications: rxMethod<void>(
          pipe(
            switchMap(() => {
              patchState(store, { notificationsLoading: true });
              return userService.getNotificationSettings().pipe(
                tapResponse({
                  next: (notifications) => {
                    patchState(store, {
                      notifications,
                      notificationsLoading: false,
                    });
                  },
                  error: (error) => {
                    loggerService.error(
                      '[UserStore] Error loading notification settings',
                      error,
                    );
                    patchState(store, { notificationsLoading: false });
                  },
                }),
              );
            }),
          ),
        ),

        updateNotification: rxMethod<{ id: number; value: NotificationValue }>(
          pipe(
            switchMap(({ id, value }) =>
              userService.updateNotificationSetting(id, value).pipe(
                tapResponse({
                  next: (updated) => {
                    patchState(store, {
                      notifications: store
                        .notifications()
                        .map((n) => (n.id === updated.id ? updated : n)),
                    });
                  },
                  error: (error) => {
                    loggerService.error(
                      '[UserStore] Error updating notification setting',
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
