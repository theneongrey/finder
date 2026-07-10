import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { forkJoin, map, of, pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { ProjectOverview } from '../models/project-overview.model';
import { StandalonePollOverview } from '../models/standalone-poll-overview.model';
import { ProjectService } from '../../_shared/data/project.service';
import { Router } from '@angular/router';
import {
  Comment,
  OptionType,
  Project,
  PollDetail,
  SharingContact,
  VisibilityType,
} from '../models/project-detail.model';
import { PermissionService } from '../../_shared/data/permission.service';
import { LoggerService } from '../../../../common/services/logger.service';

export const ProjectStore = signalStore(
  { providedIn: 'root' },
  withState({
    projects: [] as ProjectOverview[],
    standalonePolls: [] as StandalonePollOverview[],
    activeTab: 'overview' as 'overview' | 'projects' | 'polls',
    currentProject: undefined as Project | undefined,
    currentPoll: undefined as PollDetail | undefined,
    sharingContacts: [] as SharingContact[],
    sharingInProgress: false,
  }),
  withComputed((store) => ({
    projectId: computed(() => store.currentProject()?.id),
  })),
  withProps(() => {
    return {
      loggerService: inject(LoggerService),
      projectService: inject(ProjectService),
      permissionService: inject(PermissionService),
      router: inject(Router),
    };
  }),
  withMethods((store) => ({
    getProjects: rxMethod<void>(
      pipe(
        switchMap(() => {
          return store.projectService.getProjects().pipe(
            tapResponse({
              next: (projects) => {
                patchState(store, {
                  projects: projects.sort(
                    (a, b) =>
                      new Date(b.lastUpdated).getTime() -
                      new Date(a.lastUpdated).getTime(),
                  ),
                });
              },
              error: (error) => {
                store.loggerService.log(
                  '[ProjectStore] Error while loading projects',
                  error,
                );
              },
            }),
          );
        }),
      ),
    ),

    setActiveTab(tab: 'overview' | 'projects' | 'polls') {
      patchState(store, { activeTab: tab });
    },

    getStandalonePolls: rxMethod<void>(
      pipe(
        switchMap(() => {
          return store.projectService.getStandalonePolls().pipe(
            tapResponse({
              next: (polls) => {
                patchState(store, {
                  standalonePolls: polls.sort(
                    (a, b) =>
                      new Date(b.lastUpdated).getTime() -
                      new Date(a.lastUpdated).getTime(),
                  ),
                });
              },
              error: (error) => {
                store.loggerService.log(
                  '[ProjectStore] Error while loading standalone polls',
                  error,
                );
              },
            }),
          );
        }),
      ),
    ),

    addStandalonePoll: rxMethod<{
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
        switchMap((payload) => {
          return store.projectService
            .addStandalonePoll(
              payload.name,
              payload.description,
              payload.optionType,
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
                ).pipe(map(() => responsePoll));
              }),
              tapResponse({
                next: (responsePoll) => {
                  patchState(store, {
                    standalonePolls: [responsePoll, ...store.standalonePolls()],
                    activeTab: 'polls',
                  });
                  store.router.navigate(['/project/overview']);
                },
                error: (error) => {
                  store.loggerService.log(
                    '[ProjectStore] Error while adding a standalone poll',
                    error,
                  );
                },
              }),
            );
        }),
      ),
    ),

    getProject: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { currentProject: undefined })),
        switchMap((id) => {
          return store.projectService.getProject(id).pipe(
            tapResponse({
              next: (project) => {
                patchState(store, { currentProject: project });
              },
              error: (error) => {
                store.loggerService.log(
                  '[ProjectStore] Error while loading project',
                  error,
                );
              },
            }),
          );
        }),
      ),
    ),

    getPoll: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { currentPoll: undefined })),
        switchMap((id) => {
          return store.projectService.getPoll(id).pipe(
            tapResponse({
              next: (poll) => {
                patchState(store, { currentPoll: poll });
              },
              error: (error) => {
                store.loggerService.log(
                  '[ProjectStore] Error while loading poll',
                  error,
                );
              },
            }),
          );
        }),
      ),
    ),

    addProject: rxMethod<{ name: string; description: string }>(
      pipe(
        switchMap((project) => {
          return store.projectService
            .addProject(project.name, project.description)
            .pipe(
              tapResponse({
                next: (project) => {
                  patchState(store, {
                    projects: [...store.projects(), project],
                  });
                  store.router.navigate([`/project/detail/${project.id}`]);
                },
                error: (error) => {
                  store.loggerService.log(
                    '[ProjectStore] Error adding a project',
                    error,
                  );
                },
              }),
            );
        }),
      ),
    ),

    editProject: rxMethod<{ id: string; name: string; description: string }>(
      pipe(
        switchMap((project) => {
          return store.projectService
            .updateProject(project.id, project.name, project.description)
            .pipe(
              tapResponse({
                next: (updated) => {
                  patchState(store, {
                    projects: store
                      .projects()
                      .map((p) => (p.id === updated.id ? updated : p)),
                  });
                  store.router.navigate([`/project/detail/${updated.id}`]);
                },
                error: (error) => {
                  store.loggerService.log(
                    '[ProjectStore] Error updating project',
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
        switchMap((projectId) => {
          return store.projectService.deleteProject(projectId).pipe(
            tapResponse({
              next: () => {
                patchState(store, {
                  projects: store.projects().filter((p) => p.id !== projectId),
                  standalonePolls: store
                    .standalonePolls()
                    .filter((t) => t.projectId !== projectId),
                });
              },
              error: (error) => {
                store.loggerService.log(
                  '[ProjectStore] Error deleting project',
                  error,
                );
              },
            }),
          );
        }),
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
        switchMap((poll) => {
          return store.projectService
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
                    `[ProjectStore] Added poll`,
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
                    '[ProjectStore] Error while adding a poll',
                    error,
                  );
                },
              }),
            );
        }),
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
        switchMap((poll) => {
          return store.projectService
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
                    `[ProjectStore] Updated poll`,
                    poll.pollId,
                  );
                  store.router.navigate([`/project/detail/${poll.projectId}`]);
                },
                error: (error) => {
                  store.loggerService.log(
                    '[ProjectStore] Error while editing a poll',
                    error,
                  );
                },
              }),
            );
        }),
      ),
    ),

    deletePoll: rxMethod<string>(
      pipe(
        switchMap((pollId) => {
          return store.projectService.deletePoll(pollId).pipe(
            tapResponse({
              next: () => {
                patchState(store, {
                  currentProject: {
                    ...store.currentProject()!,
                    polls: [
                      ...store
                        .currentProject()!
                        .polls.filter((t) => t.id !== pollId),
                    ],
                  },
                });
              },
              error: (error) => {
                store.loggerService.log(
                  '[ProjectStore] Error deleting poll',
                  error,
                );
              },
            }),
          );
        }),
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
        switchMap((option) => {
          return store.projectService
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
                    '[ProjectStore] Error while adding an option',
                    error,
                  );
                },
              }),
            );
        }),
      ),
    ),

    deleteOption: rxMethod<string>(
      pipe(
        switchMap((optionId) => {
          return store.projectService.deleteOption(optionId).pipe(
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
                  '[ProjectStore] Error deleting option',
                  error,
                );
              },
            }),
          );
        }),
      ),
    ),

    updateVisibilityType: rxMethod<{
      projectId: string;
      type: VisibilityType;
    }>(
      pipe(
        switchMap((payload) => {
          return store.permissionService
            .updateVisibilityType(payload.projectId, payload.type)
            .pipe(
              tapResponse({
                next: () => {
                  patchState(store, {
                    currentProject: {
                      ...store.currentProject()!,
                      visibilityType: payload.type,
                    },
                  });
                },
                error: (error) => {
                  store.loggerService.log(
                    '[ProjectStore] Error updating visibility type',
                    error,
                  );
                },
              }),
            );
        }),
      ),
    ),

    loadContacts: rxMethod<string>(
      pipe(
        switchMap((projectId) => {
          return store.permissionService.getContacts(projectId).pipe(
            tapResponse({
              next: (sharingContacts) => {
                patchState(store, { sharingContacts });
              },
              error: (error) => {
                store.loggerService.log(
                  '[ProjectStore] Error loading contacts',
                  error,
                );
              },
            }),
          );
        }),
      ),
    ),

    share: rxMethod<{
      email: string;
      permissionType: number;
      projectId: string;
    }>(
      pipe(
        tap(() => patchState(store, { sharingInProgress: true })),
        switchMap((share) => {
          return store.permissionService
            .share(share.projectId, share.email, share.permissionType)
            .pipe(
              tapResponse({
                next: (sharedWith) => {
                  patchState(store, {
                    sharingInProgress: false,
                    currentProject: {
                      ...store.currentProject()!,
                      sharedWith,
                    },
                    sharingContacts: store
                      .sharingContacts()
                      .filter((c) => c.email !== share.email),
                  });
                },
                error: (error) => {
                  patchState(store, { sharingInProgress: false });
                  store.loggerService.log(
                    '[ProjectStore] Error while sharing',
                    error,
                  );
                },
              }),
            );
        }),
      ),
    ),

    removePermission: rxMethod<{ projectId: string; email: string }>(
      pipe(
        switchMap((payload) => {
          return store.permissionService
            .removePermission(payload.projectId, payload.email)
            .pipe(
              tapResponse({
                next: (sharedWith) => {
                  patchState(store, {
                    currentProject: {
                      ...store.currentProject()!,
                      sharedWith,
                    },
                  });
                },
                error: (error) => {
                  store.loggerService.log(
                    '[ProjectStore] Error removing permission',
                    error,
                  );
                },
              }),
            );
        }),
      ),
    ),

    vote: rxMethod<{
      optionId: string;
      choice: string;
    }>(
      pipe(
        switchMap((vote) => {
          return store.projectService.vote(vote.optionId, vote.choice).pipe(
            tapResponse({
              next: () => {
                const currentPoll = store.currentPoll();
                if (currentPoll) {
                  patchState(store, {
                    currentPoll: {
                      ...currentPoll,
                      options: currentPoll.options.map((o) =>
                        o.id !== vote.optionId
                          ? o
                          : { ...o, choice: vote.choice },
                      ),
                    },
                  });
                }
              },
              error: (error) => {
                store.loggerService.log(
                  '[ProjectStore] Error while voting',
                  error,
                );
              },
            }),
          );
        }),
      ),
    ),

    navigateToSharedProject: rxMethod<string>(
      pipe(
        switchMap((projectId) => {
          return store.projectService.getPublicProjectInfo(projectId).pipe(
            tapResponse({
              next: (info) => {
                if (info.isStandalone && info.pollId) {
                  store.router.navigate([
                    '/project/detail',
                    info.projectId,
                    'vote',
                    info.pollId,
                  ]);
                } else {
                  store.router.navigate(['/project/detail', info.projectId]);
                }
              },
              error: (error) => {
                store.loggerService.log(
                  '[ProjectStore] Error navigating to shared project',
                  error,
                );
              },
            }),
          );
        }),
      ),
    ),

    addComment: rxMethod<{
      pollId: string;
      content: string;
      quote?: string;
    }>(
      pipe(
        switchMap((comment) => {
          return store.projectService
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
                    '[ProjectStore] Error while adding a comment',
                    error,
                  );
                },
              }),
            );
        }),
      ),
    ),
  })),
);
