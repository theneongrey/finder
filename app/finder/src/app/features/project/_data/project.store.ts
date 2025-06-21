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
import { Project, Topic } from '../_models/project-detail.model';
import { CreateOption } from '../_models/create-option.model';

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
                store.router.navigate([`/project/${project.id}/add`]);
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
      options: CreateOption[];
    }>(
      pipe(
        switchMap((topic) => {
          return store.projectService
            .addTopic(topic.projectId, topic.name, topic.options)
            .pipe(
              tapResponse({
                next: (responseTopic) => {
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
                    `/project/${topic.projectId}/${responseTopic.id}`,
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
  })),
);
