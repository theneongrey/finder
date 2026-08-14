import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DsTabsComponent, TabItem } from '@ds/tabs/ds-tabs.component';
import { SegmentOption } from '@ds/segmented-control/ds-segmented-control.component';
import { ShareAccessFormComponent } from './share-access-form/share-access-form.component';
import { ShareInviteFormComponent } from './share-invite-form/share-invite-form.component';
import { ShareMembersListComponent } from './share-members-list/share-members-list.component';
import {
  SharedWith,
  VisibilityType,
} from '../../models/poll-detail.model';
import { SharingStore } from '../../data/sharing.store';
import { environment } from '../../../../../common/env/environment';

@Component({
  selector: 'app-share-content',
  imports: [
    DsTabsComponent,
    ShareAccessFormComponent,
    ShareInviteFormComponent,
    ShareMembersListComponent,
  ],
  templateUrl: './share-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareContentComponent {
  private readonly sharingStore = inject(SharingStore);
  private readonly translateService = inject(TranslateService);

  projectId = input.required<string>();
  sharedWith = input.required<SharedWith[]>();
  visibilityType = input.required<VisibilityType>();

  selectedVisibility = signal<VisibilityType>(VisibilityType.VisibleForSelectedOnly);
  activeTab = signal('invite');

  sharingContacts = this.sharingStore.sharingContactsSuggestion;
  sharingInProgress = this.sharingStore.sharingInProgress;

  memberCount = computed(() => this.sharedWith().length);
  isPublic = computed(() => this.selectedVisibility() === VisibilityType.VisibleForEverybody);
  shareLink = computed(() => `${environment.baseUrl}/p/${this.projectId()}`);

  private readonly inviteOnlyLabel = this.translateService.translate('project.share.inviteOnly');
  private readonly openLabel = this.translateService.translate('project.share.open');
  private readonly inviteTabLabel = this.translateService.translate('project.share.invite');
  private readonly accessTabLabel = this.translateService.translate('project.share.tabAccess');

  visibilityOptions = computed<SegmentOption[]>(() => [
    { value: 'invite-only', label: this.inviteOnlyLabel(), icon: 'lock' },
    { value: 'open', label: this.openLabel(), icon: 'globe' },
  ]);

  selectedVisibilityStr = computed(() =>
    this.selectedVisibility() === VisibilityType.VisibleForEverybody ? 'open' : 'invite-only',
  );

  tabItems = computed<TabItem[]>(() => [
    { value: 'invite', label: this.inviteTabLabel() },
    {
      value: 'members',
      label: this.accessTabLabel(),
      count: this.memberCount() > 0 ? this.memberCount() : undefined,
    },
  ]);

  constructor() {
    effect(() => {
      this.selectedVisibility.set(this.visibilityType());
    });

    effect(() => {
      this.sharingStore.loadContacts(this.projectId());
    });

    let prevProjectId: string | undefined;
    effect(() => {
      const id = this.projectId();
      if (prevProjectId !== undefined && prevProjectId !== id) {
        this.activeTab.set('invite');
      }
      prevProjectId = id;
    });
  }

  onVisibilityChange(value: string) {
    const vt = value === 'open'
      ? VisibilityType.VisibleForEverybody
      : VisibilityType.VisibleForSelectedOnly;
    this.selectedVisibility.set(vt);
    this.sharingStore.updateVisibilityType({ projectId: this.projectId(), type: vt });
  }
}
