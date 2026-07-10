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
import { Avatar } from 'primeng/avatar';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { ProjectStore } from '../../../../../../features/project/_shared/data/project.store';
import { SharingContact } from '../../../../../../features/project/_shared/models/project-detail.model';

@Component({
  selector: 'app-share-invite-form',
  templateUrl: './share-invite-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SelectButton,
    Select,
    InputText,
    Button,
    Avatar,
    FormsModule,
    TranslatePipe,
  ],
})
export class ShareInviteFormComponent {
  private readonly projectStore = inject(ProjectStore);
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

  invite() {
    const email = this.contactEmail()?.trim();
    if (!email || this.sharingInProgress()) {
      return;
    }
    this.projectStore.share({
      email,
      permissionType: this.selectedRole(),
      projectId: this.projectId(),
    });
  }
}
