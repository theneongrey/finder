import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { SharedWith, VisibilityType } from '../models/poll-detail.model';

export const sharingEvents = eventGroup({
  source: 'Sharing',
  events: {
    shared: type<{ projectId: string; sharedWith: SharedWith[] }>(),
    permissionRemoved: type<{ projectId: string; sharedWith: SharedWith[] }>(),
    visibilityTypeUpdated: type<{
      projectId: string;
      visibilityType: VisibilityType;
    }>(),
  },
});
