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
import { Project } from '../_models/project.model';
import { ProjectService } from '../_services/user.service';
import { Router } from '@angular/router';

export const ProjectStore = signalStore(
  { providedIn: 'root' },
  withState({
    projects: [] as Project[],
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
                store.loggerService.log('Error while loading projects', error);
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
                store.loggerService.log('Error while loading project', error);
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
                store.loggerService.log('Error addint a project', error);
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
                store.loggerService.log('Error deleting project', error);
              },
            }),
          );
        }),
      ),
    ),
  })),
);
