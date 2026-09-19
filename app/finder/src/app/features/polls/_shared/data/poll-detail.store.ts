import {
    patchState,
    signalStore,
    withComputed,
    withMethods,
    withProps,
    withState,
} from '@ngrx/signals';
import { on, withReducer } from '@ngrx/signals/events';
import { computed, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { forkJoin, of, pipe, switchMap, tap } from 'rxjs';
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

export const PollDetailStore = signalStore(
    { providedIn: 'root' },
    withState({
        currentProject: undefined as Project | undefined,
        currentPoll: undefined as PollDetail | undefined,
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
                tap(() => patchState(store, { currentPoll: undefined })),
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

        deletePoll: rxMethod<string>(
            pipe(
                switchMap((pollSlug) =>
                    store.projectService.deletePoll(pollSlug).pipe(
                        tapResponse({
                            next: () => {
                                store.loggerService.debug(
                                    `[PollDetailStore] Deleted poll`,
                                    pollSlug,
                                );
                                store.router.navigate(['/polls']);
                            },
                            error: (error) => {
                                store.loggerService.log(
                                    '[PollDetailStore] Error while deleting a poll',
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
                        ),
                ),
            ),
        ),
    })),
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
