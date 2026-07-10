import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Divider } from 'primeng/divider';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { ShareAccessFormComponent } from './share-access-form/share-access-form.component';
import { ShareInviteFormComponent } from './share-invite-form/share-invite-form.component';
import { ShareMembersListComponent } from './share-members-list/share-members-list.component';
import { NgTemplateOutlet } from '@angular/common';
import {
  SharedWith,
  VisibilityType,
} from '../../../../../features/project/_shared/models/project-detail.model';
import { ProjectStore } from '../../../../../features/project/_shared/data/project.store';
import { environment } from '../../../../env/environment';

@Component({
  selector: 'app-share-content',
  imports: [
    Divider,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    TranslatePipe,
    ShareAccessFormComponent,
    ShareInviteFormComponent,
    ShareMembersListComponent,
    NgTemplateOutlet,
  ],
  templateUrl: './share-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareContentComponent {
  private readonly projectStore = inject(ProjectStore);
  private readonly translateService = inject(TranslateService);

  projectId = input.required<string>();
  sharedWith = input.required<SharedWith[]>();
  visibilityType = input.required<VisibilityType>();

  selectedVisibility = signal<VisibilityType>(
    VisibilityType.VisibleForSelectedOnly,
  );
  activeTab = signal('access');

  sharingContacts = this.projectStore.sharingContacts;
  sharingInProgress = this.projectStore.sharingInProgress;

  isPublic = computed(
    () => this.selectedVisibility() === VisibilityType.VisibleForEverybody,
  );
  shareLink = computed(() => `${environment.baseUrl}/p/${this.projectId()}`);

  private inviteOnlyLabel = this.translateService.translate(
    'project.share.inviteOnly',
  );
  private openLabel = this.translateService.translate('project.share.open');

  visibilityOptions = computed(() => [
    {
      label: this.inviteOnlyLabel(),
      value: VisibilityType.VisibleForSelectedOnly,
    },
    { label: this.openLabel(), value: VisibilityType.VisibleForEverybody },
  ]);

  constructor() {
    effect(() => {
      this.selectedVisibility.set(this.visibilityType());
    });
  }

  setActiveTab(value: string | number | undefined) {
    if (value !== undefined) {
      this.activeTab.set(String(value));
    }
  }

  onVisibilityChange(value: VisibilityType) {
    this.selectedVisibility.set(value);
    this.projectStore.updateVisibilityType({
      projectId: this.projectId(),
      type: value,
    });
  }
}
