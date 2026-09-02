import { computed, inject } from '@angular/core';
import {
    patchState,
    signalStoreFeature,
    withComputed,
    withMethods,
    withState,
} from '@ngrx/signals';
import { concatMap, EMPTY, pipe, switchMap, timer } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { LoggerService } from '../services/logger.service';
import { UserService } from '../services/user.service';
import { InAppNotification } from '../models/in-app-notification.model';

export function withInAppNotificationsFeature() {
    return signalStoreFeature(
        withState({
            inAppNotifications: undefined as InAppNotification[] | undefined,
        }),
        withComputed((store) => ({
            unreadCount: computed(() => store.inAppNotifications()?.length ?? 0),
        })),
        withMethods((store) => {
            const userService = inject(UserService);
            const loggerService = inject(LoggerService);

            const loadNotifications = () =>
                userService.getInAppNotifications().pipe(
                    tapResponse({
                        next: (inAppNotifications) =>
                            patchState(store, { inAppNotifications }),
                        error: (error) =>
                            loggerService.error(
                                '[UserStore] Error loading in-app notifications',
                                error,
                            ),
                    }),
                );

            const markAsRead = rxMethod<string>(
                pipe(
                    concatMap((id) =>
                        userService.markNotificationAsRead(id).pipe(
                            tapResponse({
                                next: () =>
                                    patchState(store, {
                                        inAppNotifications:
                                            store
                                                .inAppNotifications()
                                                ?.filter((n) => n.id !== id),
                                    }),
                                error: (error) =>
                                    loggerService.error(
                                        '[UserStore] Error marking notification as read',
                                        error,
                                    ),
                            }),
                        ),
                    ),
                ),
            );

            return {
                markAsRead,

                loadInAppNotifications: rxMethod<void>(
                    pipe(switchMap(() => loadNotifications())),
                ),

                markAllAsRead: rxMethod<void>(
                    pipe(
                        switchMap(() =>
                            userService.markAllNotificationsAsRead().pipe(
                                tapResponse({
                                    next: () =>
                                        patchState(store, {
                                            inAppNotifications: [],
                                        }),
                                    error: (error) =>
                                        loggerService.error(
                                            '[UserStore] Error marking all notifications as read',
                                            error,
                                        ),
                                }),
                            ),
                        ),
                    ),
                ),

                markProjectNotificationsAsRead(projectId: string) {
                    const matching =
                        store
                            .inAppNotifications()
                            ?.filter((n) => n.projectId === projectId) ?? [];
                    matching.forEach((n) => markAsRead(n.id));
                },

                startPolling: rxMethod<void>(
                    pipe(
                        switchMap(() =>
                            timer(0, 30_000).pipe(
                                switchMap(() =>
                                    userService
                                        .getInAppNotifications()
                                        .pipe(
                                            tapResponse({
                                                next: (inAppNotifications) =>
                                                    patchState(store, {
                                                        inAppNotifications,
                                                    }),
                                                error: (error) =>
                                                    loggerService.error(
                                                        '[UserStore] Error polling in-app notifications',
                                                        error,
                                                    ),
                                            }),
                                        ),
                                ),
                            ),
                        ),
                    ),
                ),
            };
        }),
    );
}
