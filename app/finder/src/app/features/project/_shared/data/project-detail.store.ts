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
import { forkJoin, map, of, pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { ProjectService } from '../../_shared/data/project.service';
import { Router } from '@angular/router';
import {
  Comment,
  OptionType,
  Project,
  PollDetail,
} from '../models/project-detail.model';
import { sharingEvents } from './sharing.events';
import { LoggerService } from '../../../../common/services/logger.service';

export const ProjectDetailStore = signalStore(
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
    projectService: inject(ProjectService),
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
                  '[ProjectDetailStore] Error while loading project',
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
                  '[ProjectDetailStore] Error while loading poll',
                  error,
                );
              },
            }),
          ),
        ),
      ),
    ),

    addPoll: rxMethod<{
      projectId: string;
      name: string;
      description: string;
      optionType: OptionType;
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
        switchMap((poll) =>
          store.projectService
            .addPoll(
              poll.projectId,
              poll.name,
              poll.optionType,
              poll.description,
            )
            .pipe(
              switchMap((responsePoll) => {
                const optionRequests = poll.options?.length
                  ? poll.options.map((o) =>
                      store.projectService.addOption(
                        responsePoll.id,
                        o.text,
                        o.description,
                        o.meta
                          ? {
                              url: o.meta.url,
                              title: o.meta.title ?? '',
                              description: o.meta.description ?? '',
                              imageUrl: o.meta.imageUrl ?? '',
                              siteName: o.meta.siteName ?? '',
                            }
                          : undefined,
                      ),
                    )
                  : [];

                return (
                  optionRequests.length ? forkJoin(optionRequests) : of([])
                ).pipe(map((addedOptions) => ({ responsePoll, addedOptions })));
              }),
              tapResponse({
                next: ({ responsePoll, addedOptions }) => {
                  store.loggerService.debug(
                    `[ProjectDetailStore] Added poll`,
                    responsePoll,
                  );

                  const currentProject = store.currentProject();
                  if (currentProject) {
                    patchState(store, {
                      currentProject: {
                        ...currentProject,
                        polls: [
                          ...currentProject.polls,
                          {
                            id: responsePoll.id,
                            name: responsePoll.name,
                            description: responsePoll.description,
                            optionType: responsePoll.optionType,
                            optionCount: addedOptions.length,
                            commentCount: 0,
                            nextOpenOptionId: addedOptions[0]?.id,
                          },
                        ],
                      },
                    });
                  }

                  store.router.navigate([`/project/detail/${poll.projectId}`]);
                },
                error: (error) => {
                  store.loggerService.log(
                    '[ProjectDetailStore] Error while adding a poll',
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
            .updatePoll(poll.pollId, poll.name, poll.description)
            .pipe(
              switchMap(() => {
                const optionRequests = [
                  ...poll.options.map((o) => {
                    const meta = o.meta
                      ? {
                          url: o.meta.url,
                          title: o.meta.title ?? '',
                          description: o.meta.description ?? '',
                          imageUrl: o.meta.imageUrl ?? '',
                          siteName: o.meta.siteName ?? '',
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
                    `[ProjectDetailStore] Updated poll`,
                    poll.pollId,
                  );
                  store.router.navigate([`/project/detail/${poll.projectId}`]);
                },
                error: (error) => {
                  store.loggerService.log(
                    '[ProjectDetailStore] Error while editing a poll',
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
        switchMap((pollId) =>
          store.projectService.deletePoll(pollId).pipe(
            tapResponse({
              next: () => {
                patchState(store, {
                  currentProject: {
                    ...store.currentProject()!,
                    polls: store
                      .currentProject()!
                      .polls.filter((t) => t.id !== pollId),
                  },
                });
              },
              error: (error) => {
                store.loggerService.log(
                  '[ProjectDetailStore] Error deleting poll',
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
    }>(
      pipe(
        switchMap((option) =>
          store.projectService
            .addOption(
              option.pollId,
              option.text,
              option.description,
              option.meta
                ? {
                    url: option.meta.url,
                    title: option.meta.title ?? '',
                    description: option.meta.description ?? '',
                    imageUrl: option.meta.imageUrl ?? '',
                    siteName: option.meta.siteName ?? '',
                  }
                : undefined,
            )
            .pipe(
              tapResponse({
                next: (responseOption) => {
                  const currentPoll = store.currentPoll();
                  if (currentPoll?.id === option.pollId) {
                    patchState(store, {
                      currentPoll: {
                        ...currentPoll,
                        options: [
                          ...currentPoll.options,
                          {
                            id: responseOption.id,
                            text: responseOption.text,
                            description: responseOption.description,
                            meta: responseOption.meta,
                            votes: [],
                            choice: null,
                          },
                        ],
                      },
                    });
                  }
                },
                error: (error) => {
                  store.loggerService.log(
                    '[ProjectDetailStore] Error while adding an option',
                    error,
                  );
                },
              }),
            ),
        ),
      ),
    ),

    deleteOption: rxMethod<string>(
      pipe(
        switchMap((optionId) =>
          store.projectService.deleteOption(optionId).pipe(
            tapResponse({
              next: () => {
                const currentPoll = store.currentPoll();
                if (currentPoll) {
                  patchState(store, {
                    currentPoll: {
                      ...currentPoll,
                      options: currentPoll.options.filter(
                        (o) => o.id !== optionId,
                      ),
                    },
                  });
                }
              },
              error: (error) => {
                store.loggerService.log(
                  '[ProjectDetailStore] Error deleting option',
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
                  const updatedOptions = currentPoll.options.map((o) =>
                    o.id !== vote.optionId
                      ? o
                      : { ...o, choice: vote.choice },
                  );
                  patchState(store, {
                    currentPoll: { ...currentPoll, options: updatedOptions },
                  });

                  const currentProject = store.currentProject();
                  if (currentProject) {
                    const nextUnvoted = updatedOptions.find((o) => !o.choice);
                    const nextSkipped = updatedOptions
                      .filter((o) => o.choice && parseInt(o.choice) < 0)
                      .sort((a, b) => parseInt(b.choice!) - parseInt(a.choice!))[0];
                    const nextOpenOptionId = (nextUnvoted ?? nextSkipped)?.id;
                    patchState(store, {
                      currentProject: {
                        ...currentProject,
                        polls: currentProject.polls.map((p) =>
                          p.id !== currentPoll.id
                            ? p
                            : { ...p, nextOpenOptionId },
                        ),
                      },
                    });
                  }
                }
              },
              error: (error) => {
                store.loggerService.log(
                  '[ProjectDetailStore] Error while voting',
                  error,
                );
              },
            }),
          ),
        ),
      ),
    ),

    addComment: rxMethod<{ pollId: string; content: string; quote?: string }>(
      pipe(
        switchMap((comment) =>
          store.projectService
            .addComment(comment.pollId, comment.content, comment.quote)
            .pipe(
              tapResponse({
                next: (addedComment: Comment) => {
                  const currentPoll = store.currentPoll();
                  if (currentPoll?.id === comment.pollId) {
                    patchState(store, {
                      currentPoll: {
                        ...currentPoll,
                        comments: [...currentPoll.comments, addedComment],
                      },
                    });
                  }
                },
                error: (error) => {
                  store.loggerService.log(
                    '[ProjectDetailStore] Error while adding a comment',
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
    on(sharingEvents.shared, sharingEvents.permissionRemoved, ({ payload }) =>
      (state: { currentProject: Project | undefined }) =>
        state.currentProject?.id === payload.projectId
          ? { currentProject: { ...state.currentProject, sharedWith: payload.sharedWith } }
          : {},
    ),
    on(sharingEvents.visibilityTypeUpdated, ({ payload }) =>
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
