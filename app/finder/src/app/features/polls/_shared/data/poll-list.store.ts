import { computed } from '@angular/core';
import {
    patchState,
    signalStore,
    withComputed,
    withMethods,
    withProps,
    withState,
} from '@ngrx/signals';
import { on, withReducer } from '@ngrx/signals/events';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { forkJoin, map, of, pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { StandalonePollOverview } from '../models/standalone-poll-overview.model';
import { PollService } from './poll.service';
import { Router } from '@angular/router';
import { LoggerService } from '@common/services/logger.service';
import { sharingEvents } from './sharing.events';
import { OptionType } from '@common/models/option-type.model';

export const PollListStore = signalStore(
    { providedIn: 'root' },
    withState({
        standalonePolls: [] as StandalonePollOverview[],
        isLoading: true,
        lastCreatedProjectId: undefined as string | undefined,
    }),
    withComputed((store) => ({
        lastCreatedProject: computed(() => {
            const id = store.lastCreatedProjectId();
            if (!id) return undefined;
            return store.standalonePolls().find((p) => p.projectId === id);
        }),
    })),
    withProps(() => ({
        loggerService: inject(LoggerService),
        projectService: inject(PollService),
        router: inject(Router),
    })),
    withMethods((store) => ({
        getStandalonePolls: rxMethod<void>(
            pipe(
                switchMap(() => {
                    patchState(store, { isLoading: true });
                    return store.projectService.getStandalonePolls().pipe(
                        tapResponse({
                            next: (polls) => {
                                patchState(store, {
                                    standalonePolls: polls.sort(
                                        (a, b) =>
                                            new Date(b.lastUpdated).getTime() -
                                            new Date(a.lastUpdated).getTime(),
                                    ),
                                    isLoading: false,
                                });
                            },
                            error: (error) => {
                                patchState(store, { isLoading: false });
                                store.loggerService.log(
                                    '[PollListStore] Error while loading standalone polls',
                                    error,
                                );
                            },
                        }),
                    );
                }),
            ),
        ),

        deleteProject: rxMethod<string>(
            pipe(
                switchMap((projectId) =>
                    store.projectService.deleteProject(projectId).pipe(
                        tapResponse({
                            next: () => {
                                patchState(store, {
                                    standalonePolls: store
                                        .standalonePolls()
                                        .filter(
                                            (t) => t.projectId !== projectId,
                                        ),
                                });
                            },
                            error: (error) => {
                                store.loggerService.log(
                                    '[PollListStore] Error deleting project',
                                    error,
                                );
                            },
                        }),
                    ),
                ),
            ),
        ),

        toggleFavorite: rxMethod<string>(
            pipe(
                switchMap((projectSlug) =>
                    store.projectService.toggleFavorite(projectSlug).pipe(
                        tapResponse({
                            next: ({ isFavorite }) => {
                                patchState(store, {
                                    standalonePolls: store
                                        .standalonePolls()
                                        .map((p) =>
                                            p.projectId === projectSlug
                                                ? { ...p, isFavorite }
                                                : p,
                                        ),
                                });
                            },
                            error: (error) => {
                                store.loggerService.log(
                                    '[PollListStore] Error toggling favorite',
                                    error,
                                );
                            },
                        }),
                    ),
                ),
            ),
        ),

        addStandalonePoll: rxMethod<{
            name: string;
            description: string;
            optionType: OptionType;
            closeDate?: string;
            options?: {
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
        }>(
            pipe(
                switchMap((payload) =>
                    store.projectService
                        .addStandalonePoll(
                            payload.name,
                            payload.description,
                            payload.optionType,
                            payload.closeDate,
                        )
                        .pipe(
                            switchMap((responsePoll) => {
                                const optionRequests = payload.options?.length
                                    ? payload.options.map((o) =>
                                          store.projectService.addOption(
                                              responsePoll.pollId,
                                              o.text,
                                              o.description,
                                              o.meta
                                                  ? {
                                                        url: o.meta.url,
                                                        title:
                                                            o.meta.title ?? '',
                                                        description:
                                                            o.meta
                                                                .description ??
                                                            '',
                                                        imageUrl:
                                                            o.meta.imageUrl ??
                                                            '',
                                                        siteName:
                                                            o.meta.siteName ??
                                                            '',
                                                    }
                                                  : undefined,
                                          ),
                                      )
                                    : [];

                                return (
                                    optionRequests.length
                                        ? forkJoin(optionRequests)
                                        : of([])
                                ).pipe(map(() => responsePoll));
                            }),
                            tapResponse({
                                next: (responsePoll) => {
                                    patchState(store, {
                                        standalonePolls: [
                                            responsePoll,
                                            ...store.standalonePolls(),
                                        ],
                                        lastCreatedProjectId:
                                            responsePoll.projectId,
                                    });
                                },
                                error: (error) => {
                                    store.loggerService.log(
                                        '[PollListStore] Error while adding a standalone poll',
                                        error,
                                    );
                                },
                            }),
                        ),
                ),
            ),
        ),

        clearCreatedProject(): void {
            patchState(store, { lastCreatedProjectId: undefined });
        },
    })),
    withReducer(
        on(
            sharingEvents.shared,
            sharingEvents.permissionRemoved,
            ({ payload }) =>
                (state: { standalonePolls: StandalonePollOverview[] }) => ({
                    standalonePolls: state.standalonePolls.map((p) =>
                        p.projectId === payload.projectId
                            ? { ...p, sharedWith: payload.sharedWith }
                            : p,
                    ),
                }),
        ),
        on(
            sharingEvents.visibilityTypeUpdated,
            ({ payload }) =>
                (state: { standalonePolls: StandalonePollOverview[] }) => ({
                    standalonePolls: state.standalonePolls.map((p) =>
                        p.projectId === payload.projectId
                            ? { ...p, visibilityType: payload.visibilityType }
                            : p,
                    ),
                }),
        ),
    ),
);
