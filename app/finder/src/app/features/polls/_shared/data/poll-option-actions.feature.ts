import { inject } from '@angular/core';
import {
    patchState,
    signalStoreFeature,
    type,
    withMethods,
    withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { finalize, mergeMap, pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { LoggerService } from '@common/services/logger.service';
import { UserStore } from '@common/data/user.store';
import { PollService } from './poll.service';
import {
    CommentAuthor,
    OptionDetail,
    PollDetail,
    Project,
} from '../models/poll-detail.model';
import { OptionMetaInput, toOptionMeta } from '../utils/option-meta.utils';

/** The option a voter should land on next: the first unvoted one, else the latest skipped. */
function findNextOpenOptionId(options: OptionDetail[]): string | undefined {
    const nextUnvoted = options.find((o) => !o.choice);
    const nextSkipped = options
        .filter((o) => o.choice && parseInt(o.choice) < 0)
        .sort((a, b) => parseInt(b.choice!) - parseInt(a.choice!))[0];
    return (nextUnvoted ?? nextSkipped)?.id;
}

/**
 * Apply the local user's vote to an option. The detail page renders tallies from the aggregate
 * votes array, so the user's entry there is patched too — not just `choice`.
 */
function applyOwnVote(
    option: OptionDetail,
    person: string,
    choice: string,
): OptionDetail {
    const hasVote = option.votes.some((v) => v.person === person);
    const votes = hasVote
        ? option.votes.map((v) => (v.person === person ? { ...v, choice } : v))
        : [...option.votes, { person, choice }];
    return { ...option, choice, votes };
}

/** Option-level actions on the current poll: add, edit, delete and vote. */
export function withPollOptionActionsFeature() {
    return signalStoreFeature(
        {
            state: type<{
                currentPoll: PollDetail | undefined;
                currentProject: Project | undefined;
            }>(),
        },
        withState({ optionAdding: false }),
        withMethods((store) => {
            const pollService = inject(PollService);
            const loggerService = inject(LoggerService);
            const userStore = inject(UserStore);

            return {
                addOption: rxMethod<{
                    pollId: string;
                    text: string;
                    description: string;
                    meta?: OptionMetaInput;
                    creator: CommentAuthor;
                }>(
                    pipe(
                        tap(() => patchState(store, { optionAdding: true })),
                        switchMap((request) =>
                            pollService
                                .addOption(
                                    request.pollId,
                                    request.text,
                                    request.description,
                                    toOptionMeta(request.meta),
                                )
                                .pipe(
                                    tapResponse({
                                        next: (option) => {
                                            const currentPoll =
                                                store.currentPoll();
                                            if (
                                                currentPoll?.id !==
                                                request.pollId
                                            ) {
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
                                            loggerService.log(
                                                '[PollDetailStore] Error while adding an option',
                                                error,
                                            );
                                        },
                                    }),
                                    finalize(() =>
                                        patchState(store, {
                                            optionAdding: false,
                                        }),
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
                            // Preserve the existing meta — omitting it makes the backend
                            // clear the option's link/image (see UpdateOption).
                            const meta = store
                                .currentPoll()
                                ?.options.find(
                                    (o) => o.id === request.optionId,
                                )?.meta;
                            return pollService
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
                                                    options: poll.options.map(
                                                        (o) =>
                                                            o.id !==
                                                            request.optionId
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
                                            loggerService.log(
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
                            pollService.deleteOption(request.optionId).pipe(
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
                                                    (o) =>
                                                        o.id !==
                                                        request.optionId,
                                                ),
                                            },
                                        });
                                    },
                                    error: (error) => {
                                        loggerService.log(
                                            '[PollDetailStore] Error while deleting an option',
                                            error,
                                        );
                                    },
                                }),
                            ),
                        ),
                    ),
                ),

                // mergeMap (not switchMap): each vote targets a distinct option, so a
                // rapid follow-up vote must not cancel the in-flight request for the
                // previous option — that would silently drop the earlier vote.
                vote: rxMethod<{ optionId: string; choice: string }>(
                    pipe(
                        mergeMap((vote) =>
                            pollService.vote(vote.optionId, vote.choice).pipe(
                                tapResponse({
                                    next: () => {
                                        const currentPoll = store.currentPoll();
                                        if (!currentPoll) {
                                            return;
                                        }
                                        const user = userStore.user();
                                        const person =
                                            user?.name ?? user?.email ?? '';
                                        const updatedOptions =
                                            currentPoll.options.map((o) =>
                                                o.id !== vote.optionId
                                                    ? o
                                                    : applyOwnVote(
                                                          o,
                                                          person,
                                                          vote.choice,
                                                      ),
                                            );
                                        patchState(store, {
                                            currentPoll: {
                                                ...currentPoll,
                                                options: updatedOptions,
                                            },
                                        });

                                        const currentProject =
                                            store.currentProject();
                                        if (!currentProject) {
                                            return;
                                        }
                                        const nextOpenOptionId =
                                            findNextOpenOptionId(
                                                updatedOptions,
                                            );
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
                                    },
                                    error: (error) => {
                                        loggerService.log(
                                            '[PollDetailStore] Error while voting',
                                            error,
                                        );
                                    },
                                }),
                            ),
                        ),
                    ),
                ),
            };
        }),
    );
}
