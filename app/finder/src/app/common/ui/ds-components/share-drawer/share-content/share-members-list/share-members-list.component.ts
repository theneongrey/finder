import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { DsAvatarComponent } from '../../../avatar/ds-avatar.component';
import { DsBadgeComponent, BadgeTone } from '../../../badge/ds-badge.component';
import { DsButtonComponent } from '../../../button/ds-button.component';
import { DsEmptyStateButtonComponent } from '../../../empty-state-button/ds-empty-state-button.component';
import { SharedWith } from '../../../../../../features/polls/_shared/models/poll-detail.model';
import { SharingStore } from '../../../../../../features/polls/_shared/data/sharing.store';
import { PollRole } from '../../../../../../features/polls/_shared/models/poll-role.enum';

@Component({
  selector: 'app-share-members-list',
  templateUrl: './share-members-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DsAvatarComponent,
    DsBadgeComponent,
    DsButtonComponent,
    DsEmptyStateButtonComponent,
    ...HlmDropdownMenuImports,
    TranslatePipe,
  ],
})
export class ShareMembersListComponent {
  private readonly sharingStore = inject(SharingStore);
  private readonly translateService = inject(TranslateService);

  projectId = input.required<string>();
  members = input.required<SharedWith[]>();
  isPublic = input.required<boolean>();

  goInvite = output<void>();

  readonly PollRole = PollRole;

  pendingRemoveEmail = signal<string | undefined>(undefined);

  sortedMembers = computed(() =>
    [...this.members()].sort((a, b) => {
      if (b.role !== a.role) return b.role - a.role;
      return a.name.localeCompare(b.name);
    }),
  );

  roleSummaryText = computed(() => {
    const counts: Record<string, number> = {};
    for (const m of this.members()) {
      const key = this.getRoleKey(m.role);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    const order = ['creator', 'owner', 'maintainer', 'voter'];
    return Object.entries(counts)
      .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
      .map(([key, count]) => `${count} ${this.translateService.instant('project.roles.' + key)}`)
      .join(' · ');
  });

  voterLabel = this.translateService.translate('project.roles.voter');
  maintainerLabel = this.translateService.translate('project.roles.maintainer');
  ownerLabel = this.translateService.translate('project.roles.owner');

  getRoleKey(role: PollRole): string {
    switch (role) {
      case PollRole.Voter:      return 'voter';
      case PollRole.Maintainer: return 'maintainer';
      case PollRole.Owner:      return 'owner';
      case PollRole.Creator:    return 'creator';
      default:                  return 'unknown';
    }
  }

  getRoleBadgeTone(role: PollRole): BadgeTone {
    switch (role) {
      case PollRole.Creator:    return 'accent';
      case PollRole.Owner:      return 'manager';
      case PollRole.Maintainer: return 'contributor';
      default:                  return 'viewer';
    }
  }

  changeRole(email: string, permissionType: number) {
    this.sharingStore.share({ email, permissionType, projectId: this.projectId() });
  }

  onRemoveClick(email: string) {
    this.pendingRemoveEmail.set(this.pendingRemoveEmail() === email ? undefined : email);
  }

  confirmRemove(email: string) {
    this.sharingStore.removePermission({ projectId: this.projectId(), email });
    this.pendingRemoveEmail.set(undefined);
  }
}
