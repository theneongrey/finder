import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { HlmAvatar, HlmAvatarFallback, HlmAvatarImage } from '@spartan-ng/helm/avatar';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { Button } from 'primeng/button';
import { SharedWith } from '../../../../../../features/project/_shared/models/project-detail.model';
import { SharingStore } from '../../../../../../features/project/_shared/data/sharing.store';
import { ProjectRole } from '../../../../../../features/project/_shared/models/project-role.enum';

@Component({
  selector: 'app-share-members-list',
  templateUrl: './share-members-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmAvatar, HlmAvatarFallback, HlmAvatarImage, Button, ...HlmDropdownMenuImports, TranslatePipe],
})
export class ShareMembersListComponent {
  private readonly sharingStore = inject(SharingStore);
  private readonly translateService = inject(TranslateService);

  projectId = input.required<string>();
  members = input.required<SharedWith[]>();
  isPublic = input.required<boolean>();

  readonly ProjectRole = ProjectRole;

  pendingRemoveEmail = signal<string | undefined>(undefined);

  sortedMembers = computed(() =>
    [...this.members()].sort((a, b) => {
      if (b.role !== a.role) {
        return b.role - a.role;
      }
      return a.name.localeCompare(b.name);
    }),
  );

  voterLabel = this.translateService.translate('project.roles.voter');
  maintainerLabel = this.translateService.translate('project.roles.maintainer');
  ownerLabel = this.translateService.translate('project.roles.owner');

  getRoleKey(role: ProjectRole): string {
    switch (role) {
      case ProjectRole.Voter: return 'voter';
      case ProjectRole.Maintainer: return 'maintainer';
      case ProjectRole.Owner: return 'owner';
      case ProjectRole.Creator: return 'creator';
      default: return 'unknown';
    }
  }

  changeRole(email: string, permissionType: number) {
    this.sharingStore.share({
      email,
      permissionType,
      projectId: this.projectId(),
    });
  }

  onRemoveClick(email: string) {
    this.pendingRemoveEmail.set(
      this.pendingRemoveEmail() === email ? undefined : email,
    );
  }

  confirmRemove(email: string) {
    this.sharingStore.removePermission({
      projectId: this.projectId(),
      email,
    });
    this.pendingRemoveEmail.set(undefined);
  }
}
