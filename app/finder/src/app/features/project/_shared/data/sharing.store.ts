import {
  patchState,
  signalStore,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Dispatcher } from '@ngrx/signals/events';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { SharingContact, VisibilityType } from '../models/project-detail.model';
import { PermissionService } from '../../_shared/data/permission.service';
import { ProjectService } from '../../_shared/data/project.service';
import { Router } from '@angular/router';
import { LoggerService } from '../../../../common/services/logger.service';
import { sharingEvents } from './sharing.events';

export const SharingStore = signalStore(
  { providedIn: 'root' },
  withState({
    sharingContactsSuggestion: [] as SharingContact[],
    sharingInProgress: false,
  }),
  withProps(() => ({
    loggerService: inject(LoggerService),
    permissionService: inject(PermissionService),
    projectService: inject(ProjectService),
    router: inject(Router),
    dispatcher: inject(Dispatcher),
  })),
  withMethods((store) => ({
    loadContacts: rxMethod<string>(
      pipe(
        switchMap((projectId) =>
          store.permissionService.getContacts(projectId).pipe(
            tapResponse({
              next: (sharingContacts) => {
                patchState(store, {
                  sharingContactsSuggestion: sharingContacts,
                });
              },
              error: (error) => {
                store.loggerService.log(
                  '[SharingStore] Error loading contacts',
                  error,
                );
              },
            }),
          ),
        ),
      ),
    ),

    share: rxMethod<{ email: string; permissionType: number; projectId: string }>(
      pipe(
        tap(() => patchState(store, { sharingInProgress: true })),
        switchMap((share) =>
          store.permissionService
            .share(share.projectId, share.email, share.permissionType)
            .pipe(
              tapResponse({
                next: (sharedWith) => {
                  store.dispatcher.dispatch(
                    sharingEvents.shared({ projectId: share.projectId, sharedWith }),
                  );
                  patchState(store, {
                    sharingInProgress: false,
                    sharingContactsSuggestion: store
                      .sharingContactsSuggestion()
                      .filter((c) => c.email !== share.email),
                  });
                },
                error: (error) => {
                  patchState(store, { sharingInProgress: false });
                  store.loggerService.log(
                    '[SharingStore] Error while sharing',
                    error,
                  );
                },
              }),
            ),
        ),
      ),
    ),

    removePermission: rxMethod<{ projectId: string; email: string }>(
      pipe(
        switchMap((payload) =>
          store.permissionService
            .removePermission(payload.projectId, payload.email)
            .pipe(
              tapResponse({
                next: (sharedWith) => {
                  store.dispatcher.dispatch(
                    sharingEvents.permissionRemoved({ projectId: payload.projectId, sharedWith }),
                  );
                },
                error: (error) => {
                  store.loggerService.log(
                    '[SharingStore] Error removing permission',
                    error,
                  );
                },
              }),
            ),
        ),
      ),
    ),

    updateVisibilityType: rxMethod<{
      projectId: string;
      type: VisibilityType;
    }>(
      pipe(
        switchMap((payload) =>
          store.permissionService
            .updateVisibilityType(payload.projectId, payload.type)
            .pipe(
              tapResponse({
                next: () => {
                  store.dispatcher.dispatch(
                    sharingEvents.visibilityTypeUpdated({
                      projectId: payload.projectId,
                      visibilityType: payload.type,
                    }),
                  );
                },
                error: (error) => {
                  store.loggerService.log(
                    '[SharingStore] Error updating visibility type',
                    error,
                  );
                },
              }),
            ),
        ),
      ),
    ),

    navigateToSharedProject: rxMethod<string>(
      pipe(
        switchMap((projectId) =>
          store.projectService.getPublicProjectInfo(projectId).pipe(
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
                  '[SharingStore] Error navigating to shared project',
                  error,
                );
              },
            }),
          ),
        ),
      ),
    ),
  })),
);
