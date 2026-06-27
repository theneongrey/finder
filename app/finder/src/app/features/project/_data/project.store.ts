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
import { ProjectOverview } from '../_models/project-overview.model';
import { ProjectService } from '../_services/project.service';
import { Router } from '@angular/router';
import {
  Comment,
  OptionType,
  Project,
  TopicDetail,
} from '../_models/project-detail.model';
import { PermissionService } from '../_services/permission.service';
import { LoggerService } from '../../../common/services/logger.service';

export const ProjectStore = signalStore(
  { providedIn: 'root' },
  withState({
    projects: [] as ProjectOverview[],
    currentProject: undefined as Project | undefined,
    currentTopic: undefined as TopicDetail | undefined,
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

    getTopic: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { currentTopic: undefined })),
        switchMap((id) => {
          return store.projectService.getTopic(id).pipe(
            tapResponse({
              next: (topic) => {
                patchState(store, { currentTopic: topic });
              },
              error: (error) => {
                store.loggerService.log(
                  '[ProjectStore] Error while loading topic',
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

    addTopic: rxMethod<{
      projectId: string;
      name: string;
      description: string;
      optionType: OptionType;
      options?: { text: string; description: string; url: string }[];
    }>(
      pipe(
        switchMap((topic) => {
          return store.projectService
            .addTopic(
              topic.projectId,
              topic.name,
              topic.optionType,
              topic.description,
            )
            .pipe(
              switchMap((responseTopic) => {
                const optionRequests = topic.options?.length
                  ? topic.options.map((o) =>
                      store.projectService.addOption(
                        responseTopic.id,
                        o.text,
                        o.description,
                        o.url,
                      ),
                    )
                  : [];

                return (
                  optionRequests.length ? forkJoin(optionRequests) : of([])
                ).pipe(
                  map((addedOptions) => ({ responseTopic, addedOptions })),
                );
              }),
              tapResponse({
                next: ({ responseTopic, addedOptions }) => {
                  store.loggerService.debug(
                    `[ProjectStore] Added topic`,
                    responseTopic,
                  );

                  const currentProject = store.currentProject();
                  if (currentProject) {
                    patchState(store, {
                      currentProject: {
                        ...currentProject,
                        topics: [
                          ...currentProject.topics,
                          {
                            id: responseTopic.id,
                            name: responseTopic.name,
                            description: responseTopic.description,
                            optionType: responseTopic.optionType,
                            optionCount: addedOptions.length,
                            commentCount: 0,
                          },
                        ],
                      },
                    });
                  }

                  store.router.navigate([`/project/detail/${topic.projectId}`]);
                },
                error: (error) => {
                  store.loggerService.log(
                    '[ProjectStore] Error while adding a topic',
                    error,
                  );
                },
              }),
            );
        }),
      ),
    ),

    editTopic: rxMethod<{
      projectId: string;
      topicId: string;
      name: string;
      description: string;
      options: {
        id?: string;
        text: string;
        description: string;
        url: string;
      }[];
      removedOptionIds: string[];
    }>(
      pipe(
        switchMap((topic) => {
          return store.projectService
            .updateTopic(topic.topicId, topic.name, topic.description)
            .pipe(
              switchMap(() => {
                const optionRequests = [
                  ...topic.options.map((o) =>
                    o.id
                      ? store.projectService.updateOption(
                          o.id,
                          o.text,
                          o.description,
                          o.url,
                        )
                      : store.projectService.addOption(
                          topic.topicId,
                          o.text,
                          o.description,
                          o.url,
                        ),
                  ),
                  ...topic.removedOptionIds.map((id) =>
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
                    `[ProjectStore] Updated topic`,
                    topic.topicId,
                  );
                  store.router.navigate([`/project/detail/${topic.projectId}`]);
                },
                error: (error) => {
                  store.loggerService.log(
                    '[ProjectStore] Error while editing a topic',
                    error,
                  );
                },
              }),
            );
        }),
      ),
    ),

    deleteTopic: rxMethod<string>(
      pipe(
        switchMap((topicId) => {
          return store.projectService.deleteTopic(topicId).pipe(
            tapResponse({
              next: () => {
                patchState(store, {
                  currentProject: {
                    ...store.currentProject()!,
                    topics: [
                      ...store
                        .currentProject()!
                        .topics.filter((t) => t.id !== topicId),
                    ],
                  },
                });
              },
              error: (error) => {
                store.loggerService.log(
                  '[ProjectStore] Error deleting topic',
                  error,
                );
              },
            }),
          );
        }),
      ),
    ),

    addOption: rxMethod<{
      topicId: string;
      text: string;
      description: string;
      url: string;
    }>(
      pipe(
        switchMap((option) => {
          return store.projectService
            .addOption(
              option.topicId,
              option.text,
              option.description,
              option.url,
            )
            .pipe(
              tapResponse({
                next: (responseOption) => {
                  const currentTopic = store.currentTopic();
                  if (currentTopic?.id === option.topicId) {
                    patchState(store, {
                      currentTopic: {
                        ...currentTopic,
                        options: [
                          ...currentTopic.options,
                          {
                            id: responseOption.id,
                            text: responseOption.text,
                            description: responseOption.description,
                            url: responseOption.url,
                            previewImageUrl: responseOption.previewImageUrl,
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
                const currentTopic = store.currentTopic();
                if (currentTopic) {
                  patchState(store, {
                    currentTopic: {
                      ...currentTopic,
                      options: currentTopic.options.filter(
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

    share: rxMethod<{
      email: string;
      permissionType: number;
      projectId: string;
    }>(
      pipe(
        switchMap((share) => {
          return store.permissionService
            .share(share.projectId, share.email, share.permissionType)
            .pipe(
              tapResponse({
                next: (sharedWith) => {
                  patchState(store, {
                    currentProject: {
                      ...store.currentProject()!,
                      sharedWith: sharedWith,
                    },
                  });
                },
                error: (error) => {
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

    vote: rxMethod<{
      optionId: string;
      choice: string;
    }>(
      pipe(
        switchMap((vote) => {
          return store.projectService.vote(vote.optionId, vote.choice).pipe(
            tapResponse({
              next: () => {
                const currentTopic = store.currentTopic();
                if (currentTopic) {
                  patchState(store, {
                    currentTopic: {
                      ...currentTopic,
                      options: currentTopic.options.map((o) =>
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

    addComment: rxMethod<{
      topicId: string;
      content: string;
      quote?: string;
    }>(
      pipe(
        switchMap((comment) => {
          return store.projectService
            .addComment(comment.topicId, comment.content, comment.quote)
            .pipe(
              tapResponse({
                next: (addedComment: Comment) => {
                  const currentTopic = store.currentTopic();
                  if (currentTopic?.id === comment.topicId) {
                    patchState(store, {
                      currentTopic: {
                        ...currentTopic,
                        comments: [...currentTopic.comments, addedComment],
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
