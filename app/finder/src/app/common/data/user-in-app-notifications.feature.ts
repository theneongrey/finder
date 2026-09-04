import { computed, inject } from '@angular/core';
import {
    patchState,
    signalStoreFeature,
    withComputed,
    withMethods,
    withState,
} from '@ngrx/signals';
import { concatMap, pipe, switchMap, timer } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { LoggerService } from '../services/logger.service';
import { UserService } from '../services/user.service';
import { InAppNotification } from '../models/in-app-notification.model';

export function withInAppNotificationsFeature() {
    return signalStoreFeature(
        withState({
            unreadNotifications: [] as InAppNotification[],
            readNotifications: [] as InAppNotification[],
        }),
        withComputed((store) => ({
            unreadCount: computed(
                () => store.unreadNotifications().length ?? 0,
            ),
            allNotifications: computed(() =>
                [
                    ...store.unreadNotifications(),
                    ...store.readNotifications(),
                ].sort((a, b) => {
                    const createdA = a.created;
                    const createdB = b.created;
                    if (createdA < createdB) {
                        return -1;
                    }
                    if (createdA > createdB) {
                        return 1;
                    }

                    return 0;
                }),
            ),
        })),
        withMethods((store) => {
            const userService = inject(UserService);
            const loggerService = inject(LoggerService);

            const loadNotifications = () =>
                userService.getInAppNotifications().pipe(
                    tapResponse({
                        next: (inAppNotifications) =>
                            patchState(store, {
                                unreadNotifications: inAppNotifications,
                            }),
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
                                        readNotifications: store
                                            .unreadNotifications()
                                            .filter((n) => n.id === id)
                                            .map((n) => ({ ...n, read: true })),
                                        unreadNotifications: store
                                            .unreadNotifications()
                                            .filter((n) => n.id !== id),
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
                                            readNotifications: store
                                                .unreadNotifications()
                                                .map((n) => ({
                                                    ...n,
                                                    read: true,
                                                })),
                                            unreadNotifications: [],
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

                markProjectNotificationsAsRead(projectIdSlug: string) {
                    // this is a temporary fix, clean this up with AI later:
                    // the backend is supposed to pass the slug instead of the ID, when fetching notifications

                    const projectId = projectIdSlug.split('-')[1];

                    const matching =
                        store
                            .unreadNotifications()
                            ?.filter((n) => n.projectId === projectId) ?? [];
                    matching.forEach((n) => markAsRead(n.id));
                },

                startPolling: rxMethod<void>(
                    pipe(
                        switchMap(() =>
                            timer(0, 30_000).pipe(
                                switchMap(() =>
                                    userService.getInAppNotifications().pipe(
                                        tapResponse({
                                            next: (inAppNotifications) =>
                                                patchState(store, {
                                                    unreadNotifications:
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
