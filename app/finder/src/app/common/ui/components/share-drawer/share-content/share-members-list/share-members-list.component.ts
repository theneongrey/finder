import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  ViewChild,
} from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { HlmAvatar, HlmAvatarFallback, HlmAvatarImage } from '@spartan-ng/helm/avatar';
import { Button } from 'primeng/button';
import { Menu } from 'primeng/menu';
import { SharedWith } from '../../../../../../features/project/_shared/models/project-detail.model';
import { SharingStore } from '../../../../../../features/project/_shared/data/sharing.store';
import { ProjectRole } from '../../../../../../features/project/_shared/models/project-role.enum';

@Component({
  selector: 'app-share-members-list',
  templateUrl: './share-members-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmAvatar, HlmAvatarFallback, HlmAvatarImage, Button, Menu, TranslatePipe],
})
export class ShareMembersListComponent {
  private readonly sharingStore = inject(SharingStore);
  private readonly translateService = inject(TranslateService);

  @ViewChild('roleMenu') roleMenu!: Menu;

  projectId = input.required<string>();
  members = input.required<SharedWith[]>();
  isPublic = input.required<boolean>();

  readonly ProjectRole = ProjectRole;

  pendingRemoveEmail = signal<string | undefined>(undefined);
  menuItems = signal<MenuItem[]>([]);

  sortedMembers = computed(() =>
    [...this.members()].sort((a, b) => {
      if (b.role !== a.role) {
        return b.role - a.role;
      }
      return a.name.localeCompare(b.name);
    }),
  );

  private voterLabel = this.translateService.translate('project.roles.voter');
  private maintainerLabel = this.translateService.translate(
    'project.roles.maintainer',
  );
  private ownerLabel = this.translateService.translate('project.roles.owner');

  getRoleLabel(role: ProjectRole): string {
    switch (role) {
      case ProjectRole.Voter:
        return this.voterLabel();
      case ProjectRole.Maintainer:
        return this.maintainerLabel();
      case ProjectRole.Owner:
        return this.ownerLabel();
      default:
        return '';
    }
  }

  getRoleKey(role: ProjectRole): string {
    switch (role) {
      case ProjectRole.Voter:
        return 'voter';
      case ProjectRole.Maintainer:
        return 'maintainer';
      case ProjectRole.Owner:
        return 'owner';
      case ProjectRole.Creator:
        return 'creator';
      default:
        return 'unknown';
    }
  }

  openRoleMenu(event: Event, member: SharedWith) {
    this.menuItems.set([
      {
        label: this.voterLabel(),
        disabled: member.role === ProjectRole.Voter,
        command: () => this.changeRole(member.email, 0),
      },
      {
        label: this.maintainerLabel(),
        disabled: member.role === ProjectRole.Maintainer,
        command: () => this.changeRole(member.email, 1),
      },
      {
        label: this.ownerLabel(),
        disabled: member.role === ProjectRole.Owner,
        command: () => this.changeRole(member.email, 2),
      },
    ]);
    this.roleMenu.toggle(event);
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
