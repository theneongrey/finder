import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsInputComponent } from '@ds/input/ds-input.component';
import { DsSegmentedControlComponent } from '@ds/segmented-control/ds-segmented-control.component';
import { UserAvatarComponent } from '@smart/user-avatar/user-avatar.component';
import { SharingStore } from '../../../data/sharing.store';
import { SharingContact } from '../../../models/poll-detail.model';

@Component({
  selector: 'app-share-invite-form',
  templateUrl: './share-invite-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslatePipe, DsButtonComponent, DsInputComponent, DsSegmentedControlComponent, UserAvatarComponent],
})
export class ShareInviteFormComponent {
  private readonly sharingStore = inject(SharingStore);
  private readonly translateService = inject(TranslateService);

  projectId = input.required<string>();
  contacts = input.required<SharingContact[]>();
  sharingInProgress = input.required<boolean>();

  selectedRole = signal('0');
  contactEmail = signal<string | undefined>(undefined);
  dropdownVisible = signal(false);

  private readonly voterLabel = this.translateService.translate('project.roles.voter');
  private readonly maintainerLabel = this.translateService.translate('project.roles.maintainer');
  private readonly ownerLabel = this.translateService.translate('project.roles.owner');
  private readonly voterDesc = this.translateService.translate('project.share.voterDescription');
  private readonly maintainerDesc = this.translateService.translate('project.share.maintainerDescription');
  private readonly ownerDesc = this.translateService.translate('project.share.ownerDescription');

  roleOptions = computed(() => [
    { value: '0', label: this.voterLabel() },
    { value: '1', label: this.maintainerLabel() },
    { value: '2', label: this.ownerLabel() },
  ]);

  selectedRoleDescription = computed(() => {
    switch (this.selectedRole()) {
      case '0': return this.voterDesc();
      case '1': return this.maintainerDesc();
      case '2': return this.ownerDesc();
      default:  return '';
    }
  });

  filteredContacts = computed(() => {
    const q = (this.contactEmail() ?? '').toLowerCase();
    const all = this.contacts();
    if (!q) { return []; }
    return all
      .filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
      .slice(0, 5);
  });

  frequentContacts = computed(() =>
    [...this.contacts()]
      .sort((a, b) => b.shareCount - a.shareCount)
      .slice(0, 3),
  );

  constructor() {
    let wasSharingInProgress = false;
    effect(() => {
      const inProgress = this.sharingInProgress();
      if (wasSharingInProgress && !inProgress) {
        this.contactEmail.set(undefined);
      }
      wasSharingInProgress = inProgress;
    });
  }

  onEmailInput(value: string) {
    this.contactEmail.set(value);
    this.dropdownVisible.set(value.length > 0);
  }

  selectContact(contact: SharingContact) {
    this.contactEmail.set(contact.email);
    this.dropdownVisible.set(false);
  }

  invite() {
    const email = this.contactEmail()?.trim();
    if (!email || this.sharingInProgress()) { return; }
    this.dropdownVisible.set(false);
    this.sharingStore.share({
      email,
      permissionType: parseInt(this.selectedRole(), 10),
      projectId: this.projectId(),
    });
  }
}
