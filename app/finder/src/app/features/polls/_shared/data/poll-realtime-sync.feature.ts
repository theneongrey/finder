import { inject, untracked } from '@angular/core';
import {
    patchState,
    signalStoreFeature,
    type,
    withMethods,
    withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { LoggerService } from '@common/services/logger.service';
import { PollService } from './poll.service';
import { OptionDetail, PollDetail } from '../models/poll-detail.model';
import { PollDelta } from '../models/poll-delta.model';
import { dedupeIds, mergePollDelta } from '../utils/poll-delta-merge.utils';

/** How long a changed option/comment stays highlighted after a remote update. */
export const HIGHLIGHT_DURATION_MS = 2500;

/**
 * Realtime sync for the poll detail store: merges remote deltas into `currentPoll` in place,
 * tracks which items changed (drives the highlight flash) and guards options the local user is
 * editing so remote changes never clobber in-progress input.
 */
export function withPollRealtimeSyncFeature() {
    return signalStoreFeature(
        { state: type<{ currentPoll: PollDetail | undefined }>() },
        withState({
            // The last server sync token, the ids of items changed by the most recent remote
            // delta, and the ids of options the local user is editing.
            syncToken: undefined as string | undefined,
            changedOptionIds: [] as string[],
            changedCommentIds: [] as string[],
            editingOptionIds: [] as string[],
        }),
        withMethods((store) => {
            const pollService = inject(PollService);
            const loggerService = inject(LoggerService);

            // Remote changes to an option the local user is mid-editing are stashed here and
            // applied once the edit finishes, so in-progress input is never clobbered.
            const deferredOptions = new Map<string, OptionDetail>();
            let highlightTimer: ReturnType<typeof setTimeout> | undefined;

            const scheduleHighlightClear = () => {
                if (highlightTimer) {
                    clearTimeout(highlightTimer);
                }
                highlightTimer = setTimeout(() => {
                    patchState(store, {
                        changedOptionIds: [],
                        changedCommentIds: [],
                    });
                    highlightTimer = undefined;
                }, HIGHLIGHT_DURATION_MS);
            };

            const applyDelta = (delta: PollDelta) => {
                const poll = untracked(store.currentPoll);
                // The first delta after a poll loads (no token yet) is a baseline: it only
                // captures the sync token and reconciles data — it must not highlight, or every
                // item would flash on entry.
                const isBaseline = untracked(store.syncToken) === undefined;

                if (!poll) {
                    // The baseline delta can land before getPoll resolves currentPoll. That's
                    // safe: getPoll loads the full poll, so here we only need to capture the
                    // token — the next ping reconciles against it.
                    patchState(store, { syncToken: delta.syncToken });
                    return;
                }

                const merged = mergePollDelta(
                    poll,
                    delta,
                    untracked(store.editingOptionIds),
                );
                // Defer — applied when the local edit completes (see stopEditingOption).
                for (const option of merged.deferredOptions) {
                    deferredOptions.set(option.id, option);
                }

                patchState(store, {
                    currentPoll: merged.poll,
                    syncToken: delta.syncToken,
                    changedOptionIds: isBaseline
                        ? untracked(store.changedOptionIds)
                        : dedupeIds([
                              ...untracked(store.changedOptionIds),
                              ...merged.changedOptionIds,
                          ]),
                    changedCommentIds: isBaseline
                        ? untracked(store.changedCommentIds)
                        : dedupeIds([
                              ...untracked(store.changedCommentIds),
                              ...merged.changedCommentIds,
                          ]),
                });

                if (
                    !isBaseline &&
                    (merged.changedOptionIds.length ||
                        merged.changedCommentIds.length)
                ) {
                    scheduleHighlightClear();
                }
            };

            return {
                // Fetch the changes since the last sync token and patch currentPoll in place.
                // Unlike getPoll this never blanks currentPoll, so there is no flicker.
                mergeDelta: rxMethod<string>(
                    pipe(
                        switchMap((slug) =>
                            pollService
                                .getPollDelta(slug, untracked(store.syncToken))
                                .pipe(
                                    tapResponse({
                                        next: (delta) => applyDelta(delta),
                                        error: (error) => {
                                            loggerService.log(
                                                '[PollDetailStore] Error while merging poll delta',
                                                error,
                                            );
                                        },
                                    }),
                                ),
                        ),
                    ),
                ),

                // Edit-guard: while an option id is in the editing set, remote changes to it are
                // deferred rather than applied over the user's in-progress input.
                startEditingOption(optionId: string) {
                    const editing = untracked(store.editingOptionIds);
                    if (!editing.includes(optionId)) {
                        patchState(store, {
                            editingOptionIds: [...editing, optionId],
                        });
                    }
                },

                stopEditingOption(optionId: string) {
                    patchState(store, {
                        editingOptionIds: untracked(
                            store.editingOptionIds,
                        ).filter((id) => id !== optionId),
                    });

                    const deferred = deferredOptions.get(optionId);
                    if (!deferred) {
                        return;
                    }
                    deferredOptions.delete(optionId);

                    const poll = untracked(store.currentPoll);
                    if (!poll) {
                        return;
                    }
                    const exists = poll.options.some((o) => o.id === optionId);
                    const options = exists
                        ? poll.options.map((o) =>
                              o.id === optionId ? deferred : o,
                          )
                        : [...poll.options, deferred];
                    patchState(store, {
                        currentPoll: { ...poll, options },
                        changedOptionIds: dedupeIds([
                            ...untracked(store.changedOptionIds),
                            optionId,
                        ]),
                    });
                    scheduleHighlightClear();
                },

                // Reset realtime state when leaving a poll (see PollDetailComponent teardown).
                resetRealtimeState() {
                    if (highlightTimer) {
                        clearTimeout(highlightTimer);
                        highlightTimer = undefined;
                    }
                    deferredOptions.clear();
                    patchState(store, {
                        syncToken: undefined,
                        changedOptionIds: [],
                        changedCommentIds: [],
                        editingOptionIds: [],
                    });
                },
            };
        }),
    );
}
