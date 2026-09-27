import { inject } from '@angular/core';
import {
    patchState,
    signalStore,
    withMethods,
    withProps,
    withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { exhaustMap, pipe, switchMap, tap } from 'rxjs';
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
    withMethods((store) => ({
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
                            next: ({ buttonHidden }) =>
                                patchState(store, { buttonHidden }),
                            error: (error) =>
                                store.loggerService.error(
                                    '[FeedbackStore] Error loading preference',
                                    error,
                                ),
                        }),
                    ),
                ),
            ),
        ),

        // Optimistic: the tab reacts immediately, and the previous value is restored on failure.
        setButtonHidden: rxMethod<boolean>(
            pipe(
                switchMap((buttonHidden) => {
                    const previous = store.buttonHidden();
                    patchState(store, {
                        buttonHidden,
                        panelOpen: buttonHidden ? false : store.panelOpen(),
                    });
                    return store.feedbackService
                        .updatePreference(buttonHidden)
                        .pipe(
                            tapResponse({
                                next: (preference) =>
                                    patchState(store, {
                                        buttonHidden: preference.buttonHidden,
                                    }),
                                error: (error) => {
                                    store.loggerService.error(
                                        '[FeedbackStore] Error updating preference',
                                        error,
                                    );
                                    patchState(store, {
                                        buttonHidden: previous,
                                    });
                                    toast.error(
                                        store.translateService.instant(
                                            'feedback.preferenceError',
                                        ),
                                    );
                                },
                            }),
                        );
                }),
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
            patchState(store, {
                buttonHidden: undefined,
                panelOpen: false,
                submitting: false,
            });
        },
    })),
);
