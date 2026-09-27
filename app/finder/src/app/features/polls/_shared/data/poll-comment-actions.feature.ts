import { inject } from '@angular/core';
import {
    patchState,
    signalStoreFeature,
    type,
    withMethods,
    withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { finalize, pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { LoggerService } from '@common/services/logger.service';
import { PollService } from './poll.service';
import { Comment, PollDetail } from '../models/poll-detail.model';

/** Comment actions on the current poll. */
export function withPollCommentActionsFeature() {
    return signalStoreFeature(
        { state: type<{ currentPoll: PollDetail | undefined }>() },
        withState({ commentAdding: false }),
        withMethods((store) => {
            const pollService = inject(PollService);
            const loggerService = inject(LoggerService);

            return {
                addComment: rxMethod<{
                    pollId: string;
                    content: string;
                    quote?: string;
                    optionId?: string;
                }>(
                    pipe(
                        tap(() => patchState(store, { commentAdding: true })),
                        switchMap((comment) =>
                            pollService
                                .addComment(
                                    comment.pollId,
                                    comment.content,
                                    comment.quote,
                                    comment.optionId,
                                )
                                .pipe(
                                    tapResponse({
                                        next: (addedComment: Comment) => {
                                            const currentPoll =
                                                store.currentPoll();
                                            if (
                                                currentPoll?.id !==
                                                comment.pollId
                                            ) {
                                                return;
                                            }
                                            patchState(store, {
                                                currentPoll: {
                                                    ...currentPoll,
                                                    comments: [
                                                        ...currentPoll.comments,
                                                        addedComment,
                                                    ],
                                                },
                                            });
                                        },
                                        error: (error) => {
                                            loggerService.log(
                                                '[PollDetailStore] Error while adding a comment',
                                                error,
                                            );
                                        },
                                    }),
                                    finalize(() =>
                                        patchState(store, {
                                            commentAdding: false,
                                        }),
                                    ),
                                ),
                        ),
                    ),
                ),
            };
        }),
    );
}
