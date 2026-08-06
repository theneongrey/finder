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
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { SharingStore } from '../../../../../../features/project/_shared/data/sharing.store';
import { SharingContact } from '../../../../../../features/project/_shared/models/project-detail.model';
@Component({
  selector: 'app-share-invite-form',
  templateUrl: './share-invite-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HlmInput,
    HlmButton,
    ...HlmToggleGroupImports,
    FormsModule,
    TranslatePipe,
  ],
})
export class ShareInviteFormComponent {
  private readonly sharingStore = inject(SharingStore);
  private readonly translateService = inject(TranslateService);

  projectId = input.required<string>();
  contacts = input.required<SharingContact[]>();
  sharingInProgress = input.required<boolean>();

  selectedRole = signal(0);
  contactEmail = signal<string | undefined>(undefined);

  private voterLabel = this.translateService.translate('project.roles.voter');
  private maintainerLabel = this.translateService.translate(
    'project.roles.maintainer',
  );
  private ownerLabel = this.translateService.translate('project.roles.owner');
  private voterDesc = this.translateService.translate(
    'project.share.voterDescription',
  );
  private maintainerDesc = this.translateService.translate(
    'project.share.maintainerDescription',
  );
  private ownerDesc = this.translateService.translate(
    'project.share.ownerDescription',
  );

  roleOptions = computed(() => [
    { id: 0, label: this.voterLabel(), description: this.voterDesc() },
    {
      id: 1,
      label: this.maintainerLabel(),
      description: this.maintainerDesc(),
    },
    { id: 2, label: this.ownerLabel(), description: this.ownerDesc() },
  ]);

  selectedRoleDescription = computed(
    () =>
      this.roleOptions().find((r) => r.id === this.selectedRole())
        ?.description ?? '',
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

  onRoleChange(value: number | number[] | null | undefined) {
    if (typeof value === 'number') {
      this.selectedRole.set(value);
    }
  }

  invite() {
    const email = this.contactEmail()?.trim();
    if (!email || this.sharingInProgress()) {
      return;
    }
    this.sharingStore.share({
      email,
      permissionType: this.selectedRole(),
      projectId: this.projectId(),
    });
  }
}
