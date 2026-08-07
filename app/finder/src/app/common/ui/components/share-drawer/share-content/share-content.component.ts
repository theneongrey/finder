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
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { ShareAccessFormComponent } from './share-access-form/share-access-form.component';
import { ShareInviteFormComponent } from './share-invite-form/share-invite-form.component';
import { ShareMembersListComponent } from './share-members-list/share-members-list.component';
import { NgTemplateOutlet } from '@angular/common';
import {
  SharedWith,
  VisibilityType,
} from '../../../../../features/polls/_shared/models/poll-detail.model';
import { SharingStore } from '../../../../../features/polls/_shared/data/sharing.store';
import { environment } from '../../../../env/environment';

@Component({
  selector: 'app-share-content',
  imports: [
    HlmSeparator,
    ...HlmTabsImports,
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
  private readonly sharingStore = inject(SharingStore);
  private readonly translateService = inject(TranslateService);

  projectId = input.required<string>();
  sharedWith = input.required<SharedWith[]>();
  visibilityType = input.required<VisibilityType>();

  selectedVisibility = signal<VisibilityType>(
    VisibilityType.VisibleForSelectedOnly,
  );
  activeTab = signal('access');

  sharingContacts = this.sharingStore.sharingContactsSuggestion;
  sharingInProgress = this.sharingStore.sharingInProgress;

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

  setActiveTab(value: string) {
    this.activeTab.set(value);
  }

  onVisibilityChange(value: VisibilityType) {
    this.selectedVisibility.set(value);
    this.sharingStore.updateVisibilityType({
      projectId: this.projectId(),
      type: value,
    });
  }
}
