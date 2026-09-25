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

// How long a changed option/comment stays highlighted after a remote update.
const HIGHLIGHT_DURATION_MS = 2500;

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
        changedOptionIds: [] as string[],
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

        const dedupe = (ids: string[]) => Array.from(new Set(ids));

        const applyDelta = (delta: PollDelta) => {
            const poll = untracked(store.currentPoll);
            // The first delta after a poll loads (no token yet) is a baseline: it only
            // captures the sync token and reconciles data — it must not highlight, or every
            // item would flash on entry.
            const isBaseline = untracked(store.syncToken) === undefined;

            if (!poll) {
                patchState(store, { syncToken: delta.syncToken });
                return;
            }

            const editing = untracked(store.editingOptionIds);
            const changedOptionIds: string[] = [];
            let options = [...poll.options];

            for (const option of delta.options) {
                if (editing.includes(option.id)) {
                    // Defer — apply when the local edit completes (see stopEditingOption).
                    deferredOptions.set(option.id, option);
                    continue;
                }
                const index = options.findIndex((o) => o.id === option.id);
                if (index === -1) {
                    options.push(option);
                } else {
                    options[index] = option;
                }
                changedOptionIds.push(option.id);
            }

            // Reconcile hard-deletes: drop options absent from the current id-set, but keep
            // any the user is editing (their fate is resolved when the edit ends).
            const keepOptionIds = new Set(delta.currentOptionIds);
            options = options.filter(
                (o) => keepOptionIds.has(o.id) || editing.includes(o.id),
            );

            const changedCommentIds: string[] = [];
            let comments = [...poll.comments];
            for (const comment of delta.comments) {
                const index = comments.findIndex((c) => c.id === comment.id);
                if (index === -1) {
                    comments.push(comment);
                } else {
                    comments[index] = comment;
                }
                changedCommentIds.push(comment.id);
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

            patchState(store, {
                currentPoll: { ...poll, ...pollFields, options, comments },
                syncToken: delta.syncToken,
                changedOptionIds: isBaseline
                    ? untracked(store.changedOptionIds)
                    : dedupe([
                          ...untracked(store.changedOptionIds),
                          ...changedOptionIds,
                      ]),
                changedCommentIds: isBaseline
                    ? untracked(store.changedCommentIds)
                    : dedupe([
                          ...untracked(store.changedCommentIds),
                          ...changedCommentIds,
                      ]),
            });

            if (
                !isBaseline &&
                (changedOptionIds.length || changedCommentIds.length)
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
                patchState(store, {
                    editingOptionIds: untracked(store.editingOptionIds).filter(
                        (id) => id !== optionId,
                    ),
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
                    changedOptionIds: dedupe([
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
