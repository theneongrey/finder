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
import { finalize, pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { PollService } from './poll.service';
import { Router } from '@angular/router';
import { Project, PollDetail } from '../models/poll-detail.model';
import { sharingEvents } from './sharing.events';
import { LoggerService } from '@common/services/logger.service';
import { withPollEditingFeature } from './poll-editing.feature';
import { withPollOptionActionsFeature } from './poll-option-actions.feature';
import { withPollCommentActionsFeature } from './poll-comment-actions.feature';
import { withPollRealtimeSyncFeature } from './poll-realtime-sync.feature';

interface PollDetailState {
    currentProject: Project | undefined;
    currentPoll: PollDetail | undefined;
    pollRefreshing: boolean;
}

export const PollDetailStore = signalStore(
    { providedIn: 'root' },
    // Explicitly typed: otherwise TypeScript infers the state from the first feature's
    // required input and drops the other fields.
    withState<PollDetailState>({
        currentProject: undefined,
        currentPoll: undefined,
        pollRefreshing: false,
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
    })),
    withPollEditingFeature(),
    withPollOptionActionsFeature(),
    withPollCommentActionsFeature(),
    withPollRealtimeSyncFeature(),
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
