import { inject } from '@angular/core';
import {
    patchState,
    signalStore,
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
        /** undefined until the preference has been loaded for the current user. */
        buttonHidden: undefined as boolean | undefined,
        panelOpen: false,
        submitting: false,
    }),
    withProps(() => ({
        feedbackService: inject(FeedbackService),
        loggerService: inject(LoggerService),
        translateService: inject(TranslateService),
    })),
    withMethods((store) => {
        /** Last value the server returned; what an optimistic update falls back to on failure. */
        let confirmedButtonHidden: boolean | undefined;
        let pendingSaves = 0;

        return {
            openPanel(): void {
                patchState(store, { panelOpen: true });
            },

            closePanel(): void {
                patchState(store, { panelOpen: false });
            },

            loadPreference: rxMethod<void>(
                pipe(
                    switchMap(() =>
                        store.feedbackService.getPreference().pipe(
                            tapResponse({
                                next: ({ buttonHidden }) => {
                                    confirmedButtonHidden = buttonHidden;
                                    patchState(store, { buttonHidden });
                                },
                                error: (error) => {
                                    store.loggerService.error(
                                        '[FeedbackStore] Error loading preference',
                                        error,
                                    );
                                    // Fall back to the default (shown) so Settings isn't stuck on a skeleton.
                                    confirmedButtonHidden = false;
                                    patchState(store, { buttonHidden: false });
                                },
                            }),
                        ),
                    ),
                ),
            ),

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
                                error: (error) => {
                                    store.loggerService.error(
                                        '[FeedbackStore] Error submitting feedback',
                                        error,
                                    );
                                    patchState(store, { submitting: false });
                                    toast.error(
                                        store.translateService.instant(
                                            'feedback.sendError',
                                        ),
                                    );
                                },
                            }),
                        ),
                    ),
                ),
            ),

            reset(): void {
                confirmedButtonHidden = undefined;
                patchState(store, {
                    buttonHidden: undefined,
                    panelOpen: false,
                    submitting: false,
                });
            },
        };
    }),
);
