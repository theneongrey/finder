import {
  patchState,
  signalStore,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { on, withReducer } from '@ngrx/signals/events';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { forkJoin, map, of, pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { ProjectOverview } from '../models/project-overview.model';
import { StandalonePollOverview } from '../models/standalone-poll-overview.model';
import { ProjectService } from '../../_shared/data/project.service';
import { Router } from '@angular/router';
import { OptionType } from '../models/project-detail.model';
import { LoggerService } from '../../../../common/services/logger.service';
import { sharingEvents } from './sharing.events';

export const ProjectListStore = signalStore(
  { providedIn: 'root' },
  withState({
    standalonePolls: [] as StandalonePollOverview[],
  }),
  withProps(() => ({
    loggerService: inject(LoggerService),
    projectService: inject(ProjectService),
    router: inject(Router),
  })),
  withMethods((store) => ({
    getStandalonePolls: rxMethod<void>(
      pipe(
        switchMap(() =>
          store.projectService.getStandalonePolls().pipe(
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
                  '[ProjectListStore] Error while loading standalone polls',
                  error,
                );
              },
            }),
          ),
        ),
      ),
    ),

    addProject: rxMethod<{ name: string; description: string }>(
      pipe(
        switchMap((project) =>
          store.projectService
            .addProject(project.name, project.description)
            .pipe(
              tapResponse({
                next: (project: ProjectOverview) => {
                  store.router.navigate([`/project/detail/${project.id}`]);
                },
                error: (error) => {
                  store.loggerService.log(
                    '[ProjectListStore] Error adding a project',
                    error,
                  );
                },
              }),
            ),
        ),
      ),
    ),

    editProject: rxMethod<{ id: string; name: string; description: string }>(
      pipe(
        switchMap((project) =>
          store.projectService
            .updateProject(project.id, project.name, project.description)
            .pipe(
              tapResponse({
                next: (updated: ProjectOverview) => {
                  store.router.navigate([`/project/detail/${updated.id}`]);
                },
                error: (error) => {
                  store.loggerService.log(
                    '[ProjectListStore] Error updating project',
                    error,
                  );
                },
              }),
            ),
        ),
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
                    .filter((t) => t.projectId !== projectId),
                });
              },
              error: (error) => {
                store.loggerService.log(
                  '[ProjectListStore] Error deleting project',
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
                  });
                  store.router.navigate(['/project/overview']);
                },
                error: (error) => {
                  store.loggerService.log(
                    '[ProjectListStore] Error while adding a standalone poll',
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
