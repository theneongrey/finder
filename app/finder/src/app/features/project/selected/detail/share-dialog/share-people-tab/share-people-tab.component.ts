import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  SharedWith,
  SharingContact,
} from '../../../../_shared/models/project-detail.model';
import { ShareInviteFormComponent } from './share-invite-form/share-invite-form.component';
import { ShareMembersListComponent } from './share-members-list/share-members-list.component';

@Component({
  selector: 'app-share-people-tab',
  templateUrl: './share-people-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ShareInviteFormComponent, ShareMembersListComponent],
})
export class SharePeopleTabComponent {
  projectId = input.required<string>();
  sharedWith = input.required<SharedWith[]>();
  contacts = input.required<SharingContact[]>();
  sharingInProgress = input.required<boolean>();
  isPublic = input.required<boolean>();
}
