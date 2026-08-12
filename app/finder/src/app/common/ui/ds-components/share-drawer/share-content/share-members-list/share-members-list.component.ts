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
import { HlmButton } from '@spartan-ng/helm/button';
import { SharedWith } from '../../../../../../features/polls/_shared/models/poll-detail.model';
import { SharingStore } from '../../../../../../features/polls/_shared/data/sharing.store';
import { PollRole } from '../../../../../../features/polls/_shared/models/poll-role.enum';

@Component({
  selector: 'app-share-members-list',
  templateUrl: './share-members-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmAvatar, HlmAvatarFallback, HlmAvatarImage, HlmButton, ...HlmDropdownMenuImports, TranslatePipe],
})
export class ShareMembersListComponent {
  private readonly sharingStore = inject(SharingStore);
  private readonly translateService = inject(TranslateService);

  projectId = input.required<string>();
  members = input.required<SharedWith[]>();
  isPublic = input.required<boolean>();

  readonly PollRole = PollRole;

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

  getRoleKey(role: PollRole): string {
    switch (role) {
      case PollRole.Voter: return 'voter';
      case PollRole.Maintainer: return 'maintainer';
      case PollRole.Owner: return 'owner';
      case PollRole.Creator: return 'creator';
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
