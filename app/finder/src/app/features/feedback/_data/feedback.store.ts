import { computed, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
    patchState,
    signalStore,
    withComputed,
    withMethods,
    withProps,
    withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { concatMap, exhaustMap, pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { TranslateService } from '@ngx-translate/core';
import { toast } from '@spartan-ng/brain/sonner';
import { LoggerService } from '@common/services/logger.service';
import { FeedbackService } from '../_services/feedback.service';
import { SubmitFeedbackRequest } from '../_models/feedback.model';

export const FeedbackStore = signalStore(
    { providedIn: 'root' },
    withState({
        /** Server-wide switch (appsettings `Feedback:ShowButton`); undefined until loaded. */
        buttonEnabled: undefined as boolean | undefined,
        /** undefined until the preference has been loaded for the current user. */
        buttonHidden: undefined as boolean | undefined,
        /** ISO timestamp until which the server refuses feedback (scripted-burst protection). */
        feedbackDisabledUntil: undefined as string | undefined,
        /** The last preference load failed; Settings then renders the switch instead of a skeleton. */
        preferenceLoadFailed: false,
        panelOpen: false,
        submitting: false,
    }),
    withComputed(({ feedbackDisabledUntil }) => ({
        feedbackDisabled: computed(() => {
            const until = feedbackDisabledUntil();
            return !!until && new Date(until).getTime() > Date.now();
        }),
    })),
    withProps(() => ({
        feedbackService: inject(FeedbackService),
        loggerService: inject(LoggerService),
        translateService: inject(TranslateService),
    })),
    withMethods((store) => {
        /** Last value the server returned; what an optimistic update falls back to on failure. */
        let confirmedButtonHidden: boolean | undefined;
        let pendingSaves = 0;

        const loadPreference = rxMethod<void>(
            pipe(
                switchMap(() =>
                    store.feedbackService.getPreference().pipe(
                        tapResponse({
                            next: ({ buttonHidden, feedbackDisabledUntil }) => {
                                patchState(store, {
                                    feedbackDisabledUntil,
                                    preferenceLoadFailed: false,
                                });
                                // While saves are queued they own buttonHidden; this response may
                                // predate them and would flip the switch back.
                                if (pendingSaves > 0) {
                                    return;
                                }
                                confirmedButtonHidden = buttonHidden;
                                patchState(store, { buttonHidden });
                            },
                            error: (error) => {
                                store.loggerService.error(
                                    '[FeedbackStore] Error loading preference',
                                    error,
                                );
                                // Leave buttonHidden unknown: the tab only shows for an explicit
                                // `false`, so a failed load doesn't bring it back for users who hid
                                // it. The flag lets Settings render the switch instead.
                                patchState(store, {
                                    preferenceLoadFailed: true,
                                });
                            },
                        }),
                    ),
                ),
            ),
        );

        const loadConfig = rxMethod<void>(
            pipe(
                switchMap(() =>
                    store.feedbackService.getConfig().pipe(
                        tapResponse({
                            next: ({ showButton }) =>
                                patchState(store, {
                                    buttonEnabled: showButton,
                                }),
                            error: (error) => {
                                store.loggerService.error(
                                    '[FeedbackStore] Error loading config',
                                    error,
                                );
                                // It's a kill switch: without an answer, keep the feature off.
                                patchState(store, { buttonEnabled: false });
                            },
                        }),
                    ),
                ),
            ),
        );

        return {
            openPanel(): void {
                patchState(store, { panelOpen: true });
            },

            closePanel(): void {
                patchState(store, { panelOpen: false });
            },

            loadConfig,
            loadPreference,

            // Optimistic: the UI updates immediately. Saves run in order (concatMap), and only once
            // the last queued save settles is the state aligned with what the server confirmed.
            setButtonHidden: rxMethod<{
                buttonHidden: boolean;
                /** Show the "hidden — re-enable in Settings" toast once the save succeeds. */
                notifyHidden?: boolean;
            }>(
                pipe(
                    tap(({ buttonHidden }) => {
                        pendingSaves++;
                        patchState(store, {
                            buttonHidden,
                            panelOpen: buttonHidden ? false : store.panelOpen(),
                        });
                    }),
                    concatMap(({ buttonHidden, notifyHidden }) =>
                        store.feedbackService
                            .updatePreference(buttonHidden)
                            .pipe(
                                tapResponse({
                                    next: (preference) => {
                                        confirmedButtonHidden =
                                            preference.buttonHidden;
                                        if (
                                            notifyHidden &&
                                            preference.buttonHidden
                                        ) {
                                            toast.info(
                                                store.translateService.instant(
                                                    'feedback.hidden',
                                                ),
                                            );
                                        }
                                    },
                                    error: (error) => {
                                        store.loggerService.error(
                                            '[FeedbackStore] Error updating preference',
                                            error,
                                        );
                                        toast.error(
                                            store.translateService.instant(
                                                'feedback.preferenceError',
                                            ),
                                        );
                                    },
                                    finalize: () => {
                                        if (--pendingSaves === 0) {
                                            patchState(store, {
                                                buttonHidden:
                                                    confirmedButtonHidden,
                                            });
                                        }
                                    },
                                }),
                            ),
                    ),
                ),
            ),

            submit: rxMethod<SubmitFeedbackRequest>(
                pipe(
                    tap(() => patchState(store, { submitting: true })),
                    exhaustMap((request) =>
                        store.feedbackService.submit(request).pipe(
                            tapResponse({
                                next: () => {
                                    patchState(store, {
                                        submitting: false,
                                        panelOpen: false,
                                    });
                                    toast.success(
                                        store.translateService.instant(
                                            'feedback.sent',
                                        ),
                                    );
                                },
                                error: (error: HttpErrorResponse) => {
                                    store.loggerService.error(
                                        '[FeedbackStore] Error submitting feedback',
                                        error,
                                    );
                                    patchState(store, { submitting: false });
                                    switch (error.status) {
                                        case 429:
                                            toast.error(
                                                store.translateService.instant(
                                                    'feedback.limitReached',
                                                ),
                                            );
                                            break;
                                        case 403:
                                            // Disabled server-side; reload to learn until when (hides the tab).
                                            patchState(store, {
                                                panelOpen: false,
                                            });
                                            toast.error(
                                                store.translateService.instant(
                                                    'feedback.disabled',
                                                ),
                                            );
                                            loadPreference();
                                            break;
                                        default:
                                            toast.error(
                                                store.translateService.instant(
                                                    'feedback.sendError',
                                                ),
                                            );
                                    }
                                },
                            }),
                        ),
                    ),
                ),
            ),

            reset(): void {
                confirmedButtonHidden = undefined;
                patchState(store, {
                    buttonEnabled: undefined,
                    buttonHidden: undefined,
                    feedbackDisabledUntil: undefined,
                    preferenceLoadFailed: false,
                    panelOpen: false,
                    submitting: false,
                });
            },
        };
    }),
);
