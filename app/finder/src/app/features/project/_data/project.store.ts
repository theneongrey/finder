import {
  patchState,
  signalStore,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { inject } from '@angular/core';
import { LoggerService } from '../../../common/services/logger.service';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { ProjectOverview } from '../_models/project-overview.model';
import { ProjectService } from '../_services/project.service';
import { Router } from '@angular/router';
import { Project } from '../_models/project-detail.model';
import { PermissionService } from '../_services/permission.service';

export const ProjectStore = signalStore(
  { providedIn: 'root' },
  withState({
    projects: [] as ProjectOverview[],
    currentProject: undefined as Project | undefined,
  }),
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
                patchState(store, { projects });
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

    addProject: rxMethod<string>(
      pipe(
        switchMap((projectName) => {
          return store.projectService.addProject(projectName).pipe(
            tapResponse({
              next: (project) => {
                patchState(store, { projects: [...store.projects(), project] });
                store.router.navigate([`/project/detail/${project.id}/add`]);
              },
              error: (error) => {
                store.loggerService.log(
                  '[ProjectStore] Error addint a project',
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
    }>(
      pipe(
        switchMap((topic) => {
          return store.projectService
            .addTopic(topic.projectId, topic.name)
            .pipe(
              tapResponse({
                next: (responseTopic) => {
                  store.loggerService.debug(
                    `[ProjectStore] Added topic`,
                    responseTopic,
                  );

                  patchState(store, {
                    currentProject: {
                      ...store.currentProject()!,
                      topics: [
                        ...store.currentProject()!.topics,
                        responseTopic,
                      ],
                    },
                  });

                  store.router.navigate([
                    `/project/detail/${topic.projectId}/topic/${responseTopic.id}/add`,
                  ]);
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
    }>(
      pipe(
        switchMap((option) => {
          return store.projectService
            .addOption(option.topicId, option.text)
            .pipe(
              tapResponse({
                next: (responseOption) => {
                  patchState(store, {
                    currentProject: {
                      ...store.currentProject()!,
                      topics: store.currentProject()!.topics.map((t) =>
                        t.id !== option.topicId
                          ? t
                          : {
                              ...t,
                              options: [...t.options, responseOption],
                            },
                      ),
                    },
                  });
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
                patchState(store, {
                  currentProject: {
                    ...store.currentProject()!,
                    topics: [
                      ...store.currentProject()!.topics.map((t) => ({
                        ...t,
                        options: t.options.filter((o) => o.id !== optionId),
                      })),
                    ],
                  },
                });
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
              next: (_) => {
                patchState(store, {
                  currentProject: {
                    ...store.currentProject()!,
                    topics: [
                      ...store.currentProject()!.topics.map((t) => ({
                        ...t,
                        options: t.options.map((o) =>
                          o.id !== vote.optionId
                            ? o
                            : {
                                ...o,
                                choice: vote.choice,
                              },
                        ),
                      })),
                    ],
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
  })),
);
