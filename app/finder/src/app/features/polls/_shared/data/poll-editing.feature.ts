import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
    patchState,
    signalStoreFeature,
    type,
    withMethods,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { forkJoin, of, pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { LoggerService } from '@common/services/logger.service';
import { OptionType } from '@common/models/option-type.model';
import { PollService } from './poll.service';
import { PollDetail } from '../models/poll-detail.model';
import { OptionMetaInput, toOptionMeta } from '../utils/option-meta.utils';

/** Poll-level edits: the full edit wizard (poll + options) and inline name/description edits. */
export function withPollEditingFeature() {
    return signalStoreFeature(
        { state: type<{ currentPoll: PollDetail | undefined }>() },
        withMethods((store) => {
            const pollService = inject(PollService);
            const loggerService = inject(LoggerService);
            const router = inject(Router);

            return {
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
                        meta?: OptionMetaInput;
                    }[];
                    removedOptionIds: string[];
                }>(
                    pipe(
                        switchMap((poll) =>
                            pollService
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
                                                const meta = toOptionMeta(
                                                    o.meta,
                                                );
                                                return o.id
                                                    ? pollService.updateOption(
                                                          o.id,
                                                          o.text,
                                                          o.description,
                                                          meta,
                                                      )
                                                    : pollService.addOption(
                                                          poll.pollId,
                                                          o.text,
                                                          o.description,
                                                          meta,
                                                      );
                                            }),
                                            ...poll.removedOptionIds.map((id) =>
                                                pollService.deleteOption(id),
                                            ),
                                        ];

                                        return optionRequests.length
                                            ? forkJoin(optionRequests)
                                            : of([]);
                                    }),
                                    tapResponse({
                                        next: () => {
                                            loggerService.debug(
                                                `[PollDetailStore] Updated poll`,
                                                poll.pollId,
                                            );
                                            router.navigate(['/polls']);
                                        },
                                        error: (error) => {
                                            loggerService.log(
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
                            pollService
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
                                            const currentPoll =
                                                store.currentPoll();
                                            if (
                                                currentPoll?.id !== poll.pollId
                                            ) {
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
                                            loggerService.log(
                                                '[PollDetailStore] Error while updating poll details',
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
