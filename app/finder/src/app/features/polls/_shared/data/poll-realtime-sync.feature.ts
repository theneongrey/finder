import { computed, inject, untracked } from '@angular/core';
import {
    patchState,
    signalStoreFeature,
    type,
    withComputed,
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
import {
    dedupeIds,
    mergePollDelta,
    OptionChangeKind,
    RemovedOption,
} from '../utils/poll-delta-merge.utils';
import { extractSlugId } from '../utils/slug.utils';

export type { OptionChangeKind } from '../utils/poll-delta-merge.utils';

/** How long a changed option/comment stays highlighted after a remote update. */
export const HIGHLIGHT_DURATION_MS = 5000;

/**
 * Realtime sync for the poll detail store: merges remote deltas into `currentPoll` in place,
 * tracks which items changed (drives the highlight flash) and guards options the local user is
 * editing so remote changes never clobber in-progress input.
 */
export function withPollRealtimeSyncFeature() {
    return signalStoreFeature(
        { state: type<{ currentPoll: PollDetail | undefined }>() },
        withState({
            // The last server sync token, the items changed by recent remote deltas (option id →
            // change kind, comment ids), and the ids of options the local user is editing.
            syncToken: undefined as string | undefined,
            changedOptions: {} as Record<string, OptionChangeKind>,
            changedCommentIds: [] as string[],
            editingOptionIds: [] as string[],
            // Options removed remotely, kept on screen (with their former list index) only while
            // their red 'removed' flash plays. They are already gone from currentPoll.options, so
            // voting and results never see them — only displayOptions renders them.
            lingeringOptions: [] as RemovedOption[],
        }),
        withComputed((store) => ({
            /** The poll's options plus any still-flashing removed ones, at their former position. */
            displayOptions: computed(() => {
                const options = [...(store.currentPoll()?.options ?? [])];
                const lingering = [...store.lingeringOptions()].sort(
                    (a, b) => a.index - b.index,
                );
                for (const { option, index } of lingering) {
                    options.splice(Math.min(index, options.length), 0, option);
                }
                return options;
            }),
        })),
        withMethods((store) => {
            const pollService = inject(PollService);
            const loggerService = inject(LoggerService);

            // Remote changes to an option the local user is mid-editing are stashed here (keyed by
            // stable slug id, since a remote rename arrives under a different slug) and applied
            // once the edit finishes, so in-progress input is never clobbered.
            const deferredOptions = new Map<string, OptionDetail>();

            // Each highlighted item expires on its own timer, so a fresh change never re-extends
            // the flash of an item that changed earlier (e.g. adding a card must not re-flash the
            // cards edited just before it). Keys are 'opt:<id>' / 'cmt:<id>'.
            const highlightTimers = new Map<
                string,
                ReturnType<typeof setTimeout>
            >();

            const clearHighlightTimers = () => {
                for (const timer of highlightTimers.values()) {
                    clearTimeout(timer);
                }
                highlightTimers.clear();
            };

            const cancelHighlightTimer = (key: string) => {
                const timer = highlightTimers.get(key);
                if (timer) {
                    clearTimeout(timer);
                    highlightTimers.delete(key);
                }
            };

            // Drop an option's highlight once its flash has run its course; a 'removed' option is
            // only taken off screen now (it lingered so the red flash could play).
            const expireOption = (id: string) => {
                const changes = { ...untracked(store.changedOptions) };
                const kind = changes[id];
                if (kind === undefined) {
                    return;
                }
                delete changes[id];
                patchState(store, {
                    changedOptions: changes,
                    ...(kind === 'removed'
                        ? {
                              lingeringOptions: untracked(
                                  store.lingeringOptions,
                              ).filter((l) => l.option.id !== id),
                          }
                        : {}),
                });
            };

            const expireComment = (id: string) => {
                patchState(store, {
                    changedCommentIds: untracked(
                        store.changedCommentIds,
                    ).filter((c) => c !== id),
                });
            };

            const scheduleHighlightExpiry = (
                key: string,
                onExpire: () => void,
            ) => {
                const existing = highlightTimers.get(key);
                if (existing) {
                    clearTimeout(existing);
                }
                highlightTimers.set(
                    key,
                    setTimeout(() => {
                        highlightTimers.delete(key);
                        onExpire();
                    }, HIGHLIGHT_DURATION_MS),
                );
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
                    deferredOptions.set(extractSlugId(option.id), option);
                }

                // Removed options leave currentPoll.options right away. On a live update they're
                // parked in lingeringOptions (flagged 'removed') so the list can still show the red
                // flash until the highlight timer drops them; on the baseline they just go.
                const optionChanges = { ...merged.optionChanges };
                if (!isBaseline) {
                    for (const { option } of merged.removedOptions) {
                        optionChanges[option.id] = 'removed';
                    }
                }

                // A newly added card takes the spotlight: it should flash on its own, without the
                // cards edited moments earlier still glowing. So when this delta adds an option,
                // drop the prior 'updated'/'added' highlights (and cancel their timers). Pending
                // 'removed' entries are preserved — they must still leave the list when they expire.
                const hasAdd = Object.values(optionChanges).some(
                    (kind) => kind === 'added',
                );
                let nextChangedOptions: Record<string, OptionChangeKind>;
                if (isBaseline) {
                    nextChangedOptions = untracked(store.changedOptions);
                } else if (hasAdd) {
                    const prior = untracked(store.changedOptions);
                    const preserved: Record<string, OptionChangeKind> = {};
                    for (const id of Object.keys(prior)) {
                        if (prior[id] === 'removed') {
                            preserved[id] = 'removed';
                        } else if (!(id in optionChanges)) {
                            cancelHighlightTimer(`opt:${id}`);
                        }
                    }
                    nextChangedOptions = { ...preserved, ...optionChanges };
                } else {
                    nextChangedOptions = {
                        ...untracked(store.changedOptions),
                        ...optionChanges,
                    };
                }

                patchState(store, {
                    currentPoll: merged.poll,
                    lingeringOptions: isBaseline
                        ? untracked(store.lingeringOptions)
                        : [
                              ...untracked(store.lingeringOptions),
                              ...merged.removedOptions,
                          ],
                    syncToken: delta.syncToken,
                    changedOptions: nextChangedOptions,
                    changedCommentIds: isBaseline
                        ? untracked(store.changedCommentIds)
                        : dedupeIds([
                              ...untracked(store.changedCommentIds),
                              ...merged.changedCommentIds,
                          ]),
                });

                if (!isBaseline) {
                    for (const id of Object.keys(optionChanges)) {
                        scheduleHighlightExpiry(`opt:${id}`, () =>
                            expireOption(id),
                        );
                    }
                    for (const id of merged.changedCommentIds) {
                        scheduleHighlightExpiry(`cmt:${id}`, () =>
                            expireComment(id),
                        );
                    }
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
                    const stableId = extractSlugId(optionId);
                    patchState(store, {
                        editingOptionIds: untracked(
                            store.editingOptionIds,
                        ).filter((id) => id !== optionId),
                    });

                    const deferred = deferredOptions.get(stableId);
                    if (!deferred) {
                        return;
                    }
                    deferredOptions.delete(stableId);

                    const poll = untracked(store.currentPoll);
                    if (!poll) {
                        return;
                    }
                    const exists = poll.options.some(
                        (o) => extractSlugId(o.id) === stableId,
                    );
                    const options = exists
                        ? poll.options.map((o) =>
                              extractSlugId(o.id) === stableId ? deferred : o,
                          )
                        : [...poll.options, deferred];
                    // The deferred change may carry a new slug (remote rename), so flash under its id.
                    const highlightId = deferred.id;
                    patchState(store, {
                        currentPoll: { ...poll, options },
                        changedOptions: {
                            ...untracked(store.changedOptions),
                            [highlightId]: exists ? 'updated' : 'added',
                        },
                    });
                    scheduleHighlightExpiry(`opt:${highlightId}`, () =>
                        expireOption(highlightId),
                    );
                },

                // Clear the option flashes (e.g. when the local user adds an option): a fresh add
                // takes the spotlight, so cards edited moments earlier shouldn't keep glowing. Any
                // options still lingering for their 'removed' flash are dropped now. Comment
                // highlights are left untouched.
                clearOptionHighlights() {
                    for (const id of Object.keys(
                        untracked(store.changedOptions),
                    )) {
                        cancelHighlightTimer(`opt:${id}`);
                    }
                    patchState(store, {
                        changedOptions: {},
                        lingeringOptions: [],
                    });
                },

                // Reset realtime state when leaving a poll (see PollDetailComponent teardown).
                resetRealtimeState() {
                    clearHighlightTimers();
                    deferredOptions.clear();
                    patchState(store, {
                        syncToken: undefined,
                        changedOptions: {},
                        changedCommentIds: [],
                        editingOptionIds: [],
                        lingeringOptions: [],
                    });
                },
            };
        }),
    );
}
