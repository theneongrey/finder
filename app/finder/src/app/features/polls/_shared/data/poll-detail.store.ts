import {
    patchState,
    signalStore,
    withComputed,
    withMethods,
    withProps,
    withState,
} from '@ngrx/signals';
import { on, withReducer } from '@ngrx/signals/events';
import { computed, inject, untracked } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { finalize, forkJoin, of, pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { PollService } from './poll.service';
import { Router } from '@angular/router';
import {
    Comment,
    CommentAuthor,
    OptionDetail,
    Project,
    PollDetail,
} from '../models/poll-detail.model';
import { sharingEvents } from './sharing.events';
import { LoggerService } from '@common/services/logger.service';
import { OptionType } from '@common/models/option-type.model';
import { PollDelta } from '../models/poll-delta.model';
import { extractSlugId } from '../utils/slug.utils';

// How long a changed option/comment stays highlighted after a remote update. Kept in sync
// with the flash animation durations in option-list.component.css / comments-section.component.css.
const HIGHLIGHT_DURATION_MS = 5000;

/**
 * How a remote delta touched an option, so the UI can colour the flash:
 * green (added), blue (updated), red (removed). Removed options linger with the
 * red flash for HIGHLIGHT_DURATION_MS before they are dropped from the list.
 */
export type OptionChangeKind = 'added' | 'updated' | 'removed';

export const PollDetailStore = signalStore(
    { providedIn: 'root' },
    withState({
        currentProject: undefined as Project | undefined,
        currentPoll: undefined as PollDetail | undefined,
        pollRefreshing: false,
        optionAdding: false,
        commentAdding: false,
        // Realtime sync (see mergeDelta): the last server sync token, the ids of items
        // changed by the most recent remote delta (drive the highlight flash), and the ids
        // of options the local user is editing (their remote changes are deferred).
        syncToken: undefined as string | undefined,
        changedOptions: {} as Record<string, OptionChangeKind>,
        changedCommentIds: [] as string[],
        editingOptionIds: [] as string[],
    }),
    withComputed((store) => ({
        projectId: computed(() => store.currentProject()?.id),
    })),
    withProps(() => ({
        loggerService: inject(LoggerService),
        projectService: inject(PollService),
        router: inject(Router),
    })),
    withMethods((store) => ({
        getProject: rxMethod<string>(
            pipe(
                tap(() => patchState(store, { currentProject: undefined })),
                switchMap((id) =>
                    store.projectService.getProject(id).pipe(
                        tapResponse({
                            next: (project) => {
                                patchState(store, { currentProject: project });
                            },
                            error: (error) => {
                                store.loggerService.log(
                                    '[PollDetailStore] Error while loading project',
                                    error,
                                );
                            },
                        }),
                    ),
                ),
            ),
        ),

        getPoll: rxMethod<string>(
            pipe(
                // Only clear when switching to a different poll — refetching the
                // same poll (refresh, vote overlay open/close) keeps the current
                // data on screen so the detail page doesn't flash to the skeleton
                // and re-run entry animations (e.g. the open add-option card).
                // getPoll is called synchronously from effects, so read the
                // current poll untracked to avoid the read becoming a dependency
                // of the caller's effect (which would refetch in a loop).
                tap((id) => {
                    if (untracked(store.currentPoll)?.id !== id) {
                        patchState(store, { currentPoll: undefined });
                    }
                    patchState(store, { pollRefreshing: true });
                }),
                switchMap((id) =>
                    store.projectService.getPoll(id).pipe(
                        tapResponse({
                            next: (poll) => {
                                patchState(store, { currentPoll: poll });
                            },
                            error: (error) => {
                                store.loggerService.log(
                                    '[PollDetailStore] Error while loading poll',
                                    error,
                                );
                            },
                        }),
                        finalize(() =>
                            patchState(store, { pollRefreshing: false }),
                        ),
                    ),
                ),
            ),
        ),

        editPoll: rxMethod<{
            projectId: string;
            pollId: string;
            name: string;
            description: string;
            optionType?: OptionType;
            closeDate?: string;
            options: {
                id?: string;
                text: string;
                description: string;
                meta?: {
                    url: string;
                    title?: string;
                    description?: string;
                    imageUrl?: string;
                    siteName?: string;
                };
            }[];
            removedOptionIds: string[];
        }>(
            pipe(
                switchMap((poll) =>
                    store.projectService
                        .updatePoll(
                            poll.pollId,
                            poll.name,
                            poll.description,
                            poll.closeDate,
                            poll.optionType,
                        )
                        .pipe(
                            switchMap(() => {
                                const optionRequests = [
                                    ...poll.options.map((o) => {
                                        const meta = o.meta
                                            ? {
                                                  url: o.meta.url,
                                                  title: o.meta.title ?? '',
                                                  description:
                                                      o.meta.description ?? '',
                                                  imageUrl:
                                                      o.meta.imageUrl ?? '',
                                                  siteName:
                                                      o.meta.siteName ?? '',
                                              }
                                            : undefined;
                                        return o.id
                                            ? store.projectService.updateOption(
                                                  o.id,
                                                  o.text,
                                                  o.description,
                                                  meta,
                                              )
                                            : store.projectService.addOption(
                                                  poll.pollId,
                                                  o.text,
                                                  o.description,
                                                  meta,
                                              );
                                    }),
                                    ...poll.removedOptionIds.map((id) =>
                                        store.projectService.deleteOption(id),
                                    ),
                                ];

                                return optionRequests.length
                                    ? forkJoin(optionRequests)
                                    : of([]);
                            }),
                            tapResponse({
                                next: () => {
                                    store.loggerService.debug(
                                        `[PollDetailStore] Updated poll`,
                                        poll.pollId,
                                    );
                                    store.router.navigate(['/polls']);
                                },
                                error: (error) => {
                                    store.loggerService.log(
                                        '[PollDetailStore] Error while editing a poll',
                                        error,
                                    );
                                },
                            }),
                        ),
                ),
            ),
        ),

        updatePollDetails: rxMethod<{
            pollId: string;
            name: string;
            description: string;
        }>(
            pipe(
                switchMap((poll) =>
                    store.projectService
                        .updatePoll(
                            poll.pollId,
                            poll.name,
                            poll.description,
                            // Preserve the existing close date — omitting it makes
                            // the backend clear CloseDate (see UpdatePoll).
                            store.currentPoll()?.closeDate,
                        )
                        .pipe(
                            tapResponse({
                                next: (updatedPoll) => {
                                    const currentPoll = store.currentPoll();
                                    if (currentPoll?.id !== poll.pollId) {
                                        return;
                                    }
                                    patchState(store, {
                                        currentPoll: {
                                            ...currentPoll,
                                            name: updatedPoll.name,
                                            description:
                                                updatedPoll.description,
                                        },
                                    });
                                },
                                error: (error) => {
                                    store.loggerService.log(
                                        '[PollDetailStore] Error while updating poll details',
                                        error,
                                    );
                                },
                            }),
                        ),
                ),
            ),
        ),

        // Standalone polls are backed 1:1 by a project, so deleting the poll
        // means deleting its whole project.
        deleteProject: rxMethod<string>(
            pipe(
                switchMap((projectId) =>
                    store.projectService.deleteProject(projectId).pipe(
                        tapResponse({
                            next: () => {
                                store.loggerService.debug(
                                    `[PollDetailStore] Deleted project`,
                                    projectId,
                                );
                                store.router.navigate(['/polls']);
                            },
                            error: (error) => {
                                store.loggerService.log(
                                    '[PollDetailStore] Error while deleting a project',
                                    error,
                                );
                            },
                        }),
                    ),
                ),
            ),
        ),

        addOption: rxMethod<{
            pollId: string;
            text: string;
            description: string;
            meta?: {
                url: string;
                title?: string;
                description?: string;
                imageUrl?: string;
                siteName?: string;
            };
            creator: CommentAuthor;
        }>(
            pipe(
                tap(() => patchState(store, { optionAdding: true })),
                switchMap((request) =>
                    store.projectService
                        .addOption(
                            request.pollId,
                            request.text,
                            request.description,
                            request.meta
                                ? {
                                      url: request.meta.url,
                                      title: request.meta.title ?? '',
                                      description:
                                          request.meta.description ?? '',
                                      imageUrl: request.meta.imageUrl ?? '',
                                      siteName: request.meta.siteName ?? '',
                                  }
                                : undefined,
                        )
                        .pipe(
                            tapResponse({
                                next: (option) => {
                                    const currentPoll = store.currentPoll();
                                    if (currentPoll?.id !== request.pollId) {
                                        return;
                                    }
                                    const newOption: OptionDetail = {
                                        id: option.id,
                                        text: option.text,
                                        description: option.description,
                                        meta: option.meta,
                                        votes: [],
                                        choice: null,
                                        creator: request.creator,
                                    };
                                    patchState(store, {
                                        currentPoll: {
                                            ...currentPoll,
                                            options: [
                                                ...currentPoll.options,
                                                newOption,
                                            ],
                                        },
                                    });
                                },
                                error: (error) => {
                                    store.loggerService.log(
                                        '[PollDetailStore] Error while adding an option',
                                        error,
                                    );
                                },
                            }),
                            finalize(() =>
                                patchState(store, { optionAdding: false }),
                            ),
                        ),
                ),
            ),
        ),

        updateOption: rxMethod<{
            optionId: string;
            text: string;
            description: string;
        }>(
            pipe(
                switchMap((request) => {
                    const currentPoll = store.currentPoll();
                    // Preserve the existing meta — omitting it makes the backend
                    // clear the option's link/image (see UpdateOption).
                    const meta = currentPoll?.options.find(
                        (o) => o.id === request.optionId,
                    )?.meta;
                    return store.projectService
                        .updateOption(
                            request.optionId,
                            request.text,
                            request.description,
                            meta,
                        )
                        .pipe(
                            tapResponse({
                                next: (option) => {
                                    const poll = store.currentPoll();
                                    if (!poll) {
                                        return;
                                    }
                                    patchState(store, {
                                        currentPoll: {
                                            ...poll,
                                            options: poll.options.map((o) =>
                                                o.id !== request.optionId
                                                    ? o
                                                    : {
                                                          ...o,
                                                          text: option.text,
                                                          description:
                                                              option.description,
                                                          meta: option.meta,
                                                      },
                                            ),
                                        },
                                    });
                                },
                                error: (error) => {
                                    store.loggerService.log(
                                        '[PollDetailStore] Error while updating an option',
                                        error,
                                    );
                                },
                            }),
                        );
                }),
            ),
        ),

        deleteOption: rxMethod<{ optionId: string }>(
            pipe(
                switchMap((request) =>
                    store.projectService.deleteOption(request.optionId).pipe(
                        tapResponse({
                            next: () => {
                                const poll = store.currentPoll();
                                if (!poll) {
                                    return;
                                }
                                patchState(store, {
                                    currentPoll: {
                                        ...poll,
                                        options: poll.options.filter(
                                            (o) => o.id !== request.optionId,
                                        ),
                                    },
                                });
                            },
                            error: (error) => {
                                store.loggerService.log(
                                    '[PollDetailStore] Error while deleting an option',
                                    error,
                                );
                            },
                        }),
                    ),
                ),
            ),
        ),

        vote: rxMethod<{ optionId: string; choice: string }>(
            pipe(
                switchMap((vote) =>
                    store.projectService.vote(vote.optionId, vote.choice).pipe(
                        tapResponse({
                            next: () => {
                                const currentPoll = store.currentPoll();
                                if (currentPoll) {
                                    const updatedOptions =
                                        currentPoll.options.map((o) =>
                                            o.id !== vote.optionId
                                                ? o
                                                : { ...o, choice: vote.choice },
                                        );
                                    patchState(store, {
                                        currentPoll: {
                                            ...currentPoll,
                                            options: updatedOptions,
                                        },
                                    });

                                    const currentProject =
                                        store.currentProject();
                                    if (currentProject) {
                                        const nextUnvoted = updatedOptions.find(
                                            (o) => !o.choice,
                                        );
                                        const nextSkipped = updatedOptions
                                            .filter(
                                                (o) =>
                                                    o.choice &&
                                                    parseInt(o.choice) < 0,
                                            )
                                            .sort(
                                                (a, b) =>
                                                    parseInt(b.choice!) -
                                                    parseInt(a.choice!),
                                            )[0];
                                        const nextOpenOptionId = (
                                            nextUnvoted ?? nextSkipped
                                        )?.id;
                                        patchState(store, {
                                            currentProject: {
                                                ...currentProject,
                                                polls: currentProject.polls.map(
                                                    (p) =>
                                                        p.id !== currentPoll.id
                                                            ? p
                                                            : {
                                                                  ...p,
                                                                  nextOpenOptionId,
                                                              },
                                                ),
                                            },
                                        });
                                    }
                                }
                            },
                            error: (error) => {
                                store.loggerService.log(
                                    '[PollDetailStore] Error while voting',
                                    error,
                                );
                            },
                        }),
                    ),
                ),
            ),
        ),

        closePoll: rxMethod<string>(
            pipe(
                switchMap((pollSlug) =>
                    store.projectService.closePoll(pollSlug).pipe(
                        tapResponse({
                            next: (updatedPoll) => {
                                patchState(store, { currentPoll: updatedPoll });
                            },
                            error: (error) => {
                                store.loggerService.log(
                                    '[PollDetailStore] Error closing poll',
                                    error,
                                );
                            },
                        }),
                    ),
                ),
            ),
        ),

        reopenPoll: rxMethod<string>(
            pipe(
                switchMap((pollSlug) =>
                    store.projectService.reopenPoll(pollSlug).pipe(
                        tapResponse({
                            next: (updatedPoll) => {
                                patchState(store, { currentPoll: updatedPoll });
                            },
                            error: (error) => {
                                store.loggerService.log(
                                    '[PollDetailStore] Error reopening poll',
                                    error,
                                );
                            },
                        }),
                    ),
                ),
            ),
        ),

        addComment: rxMethod<{
            pollId: string;
            content: string;
            quote?: string;
            optionId?: string;
        }>(
            pipe(
                tap(() => patchState(store, { commentAdding: true })),
                switchMap((comment) =>
                    store.projectService
                        .addComment(
                            comment.pollId,
                            comment.content,
                            comment.quote,
                            comment.optionId,
                        )
                        .pipe(
                            tapResponse({
                                next: (addedComment: Comment) => {
                                    const currentPoll = store.currentPoll();
                                    if (currentPoll?.id === comment.pollId) {
                                        patchState(store, {
                                            currentPoll: {
                                                ...currentPoll,
                                                comments: [
                                                    ...currentPoll.comments,
                                                    addedComment,
                                                ],
                                            },
                                        });
                                    }
                                },
                                error: (error) => {
                                    store.loggerService.log(
                                        '[PollDetailStore] Error while adding a comment',
                                        error,
                                    );
                                },
                            }),
                            finalize(() =>
                                patchState(store, { commentAdding: false }),
                            ),
                        ),
                ),
            ),
        ),
    })),
    withMethods((store) => {
        // Remote changes to an option the local user is mid-editing are stashed here and
        // applied once the edit finishes, so in-progress input is never clobbered.
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
        // only actually dropped from the list now (it lingered so the red flash could play).
        const expireOption = (id: string) => {
            const changes = { ...untracked(store.changedOptions) };
            const kind = changes[id];
            if (kind === undefined) {
                return;
            }
            delete changes[id];
            const poll = untracked(store.currentPoll);
            patchState(store, {
                changedOptions: changes,
                ...(kind === 'removed' && poll
                    ? {
                          currentPoll: {
                              ...poll,
                              options: poll.options.filter((o) => o.id !== id),
                          },
                      }
                    : {}),
            });
        };

        const expireComment = (id: string) => {
            patchState(store, {
                changedCommentIds: untracked(store.changedCommentIds).filter(
                    (c) => c !== id,
                ),
            });
        };

        const scheduleHighlightExpiry = (key: string, onExpire: () => void) => {
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

        const dedupe = (ids: string[]) => Array.from(new Set(ids));

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

            const editing = untracked(store.editingOptionIds);
            const optionChanges: Record<string, OptionChangeKind> = {};
            let options = [...poll.options];

            // Only ids changed strictly after the token flash; the rest of delta.options may be
            // re-sent to cover the boundary overlap and must be upserted without re-highlighting.
            const highlightOptionIds = new Set(delta.highlightedOptionIds);

            for (const option of delta.options) {
                // Identity is the trailing slug id, not the whole slug: the slug encodes the title,
                // so a rename yields a new slug for the same option. Matching on the stable id keeps
                // a rename a single in-place update instead of an add + delete.
                const stableId = extractSlugId(option.id);
                if (editing.some((id) => extractSlugId(id) === stableId)) {
                    // Defer — apply when the local edit completes (see stopEditingOption).
                    deferredOptions.set(stableId, option);
                    continue;
                }
                const index = options.findIndex(
                    (o) => extractSlugId(o.id) === stableId,
                );
                const isNew = index === -1;
                if (isNew) {
                    options.push(option);
                } else {
                    options[index] = option;
                }
                if (highlightOptionIds.has(option.id)) {
                    optionChanges[option.id] = isNew ? 'added' : 'updated';
                }
            }

            // Reconcile hard-deletes: options absent from the current id-set were removed
            // remotely. On a live update we keep them on screen (flagged 'removed') so they
            // get the red flash; the highlight-clear timer drops them once it fires. On the
            // baseline they're reconciled away silently. Editing options are exempt either way.
            const keepOptionIds = new Set(delta.currentOptionIds);
            const removedIds = options
                .filter(
                    (o) =>
                        !keepOptionIds.has(o.id) &&
                        !editing.some(
                            (id) => extractSlugId(id) === extractSlugId(o.id),
                        ),
                )
                .map((o) => o.id);
            if (isBaseline) {
                options = options.filter((o) => !removedIds.includes(o.id));
            } else {
                for (const id of removedIds) {
                    optionChanges[id] = 'removed';
                }
            }

            const highlightCommentIds = new Set(delta.highlightedCommentIds);
            const changedCommentIds: string[] = [];
            let comments = [...poll.comments];
            for (const comment of delta.comments) {
                const index = comments.findIndex((c) => c.id === comment.id);
                if (index === -1) {
                    comments.push(comment);
                } else {
                    comments[index] = comment;
                }
                if (highlightCommentIds.has(comment.id)) {
                    changedCommentIds.push(comment.id);
                }
            }
            const keepCommentIds = new Set(delta.currentCommentIds);
            comments = comments.filter((c) => keepCommentIds.has(c.id));

            const pollFields = delta.poll
                ? {
                      name: delta.poll.name,
                      description: delta.poll.description,
                      optionType: delta.poll.optionType,
                      closeDate: delta.poll.closeDate,
                      isClosed: delta.poll.isClosed,
                  }
                : {};

            // A newly added card takes the spotlight: it should flash on its own, without the
            // cards edited moments earlier still glowing. So when this delta adds an option, drop
            // the prior 'updated'/'added' highlights (and cancel their timers). Pending 'removed'
            // entries are preserved — they must still be dropped from the list when they expire.
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
                currentPoll: { ...poll, ...pollFields, options, comments },
                syncToken: delta.syncToken,
                changedOptions: nextChangedOptions,
                changedCommentIds: isBaseline
                    ? untracked(store.changedCommentIds)
                    : dedupe([
                          ...untracked(store.changedCommentIds),
                          ...changedCommentIds,
                      ]),
            });

            if (!isBaseline) {
                for (const id of Object.keys(optionChanges)) {
                    scheduleHighlightExpiry(`opt:${id}`, () =>
                        expireOption(id),
                    );
                }
                for (const id of changedCommentIds) {
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
                        store.projectService
                            .getPollDelta(slug, untracked(store.syncToken))
                            .pipe(
                                tapResponse({
                                    next: (delta) => applyDelta(delta),
                                    error: (error) => {
                                        store.loggerService.log(
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
                    editingOptionIds: untracked(store.editingOptionIds).filter(
                        (id) => id !== optionId,
                    ),
                });

                // Deferred remote changes are keyed by stable id (a remote rename would arrive
                // under a different slug), so resolve them by that too.
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
                const changes = untracked(store.changedOptions);
                const removedIds = Object.keys(changes).filter(
                    (id) => changes[id] === 'removed',
                );
                for (const id of Object.keys(changes)) {
                    cancelHighlightTimer(`opt:${id}`);
                }
                const poll = untracked(store.currentPoll);
                patchState(store, {
                    changedOptions: {},
                    ...(poll && removedIds.length
                        ? {
                              currentPoll: {
                                  ...poll,
                                  options: poll.options.filter(
                                      (o) => !removedIds.includes(o.id),
                                  ),
                              },
                          }
                        : {}),
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
                });
            },
        };
    }),
    withReducer(
        on(
            sharingEvents.shared,
            sharingEvents.permissionRemoved,
            ({ payload }) =>
                (state: { currentProject: Project | undefined }) =>
                    state.currentProject?.id === payload.projectId
                        ? {
                              currentProject: {
                                  ...state.currentProject,
                                  sharedWith: payload.sharedWith,
                              },
                          }
                        : {},
        ),
        on(
            sharingEvents.visibilityTypeUpdated,
            ({ payload }) =>
                (state: { currentProject: Project | undefined }) =>
                    state.currentProject?.id === payload.projectId
                        ? {
                              currentProject: {
                                  ...state.currentProject,
                                  visibilityType: payload.visibilityType,
                              },
                          }
                        : {},
        ),
    ),
);
