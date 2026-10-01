import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PollItem } from '../../models/poll-item.model';
import { PollRole } from '../../models/poll-role.enum';
import { PollVotingStatus } from '../../models/standalone-poll-overview.model';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { DsMenuComponent, MenuItem } from '@ds/menu/ds-menu.component';
import { DsCardComponent } from '@ds/card/ds-card.component';
import { DsStatusDotComponent } from '@ds/badge/ds-status-dot.component';
import { OptionTypeBadgeComponent } from '@smart/option-type-badge/option-type-badge.component';
import { PollItemTimeComponent } from './poll-item-time/poll-item-time.component';
import { PollItemVotersComponent } from './poll-item-voters/poll-item-voters.component';
import { AvatarUser } from '@smart/avatar-stack/avatar-stack.component';

@Component({
    selector: 'app-poll-item',
    host: {
        '[class.is-confirming]': 'showDeleteConfirm()',
        '[class.is-removing]': 'isRemoving()',
        '[class.is-settling]': 'isSettling()',
    },
    imports: [
        RouterLink,
        TranslatePipe,
        DsCardComponent,
        DsButtonComponent,
        DsIconComponent,
        DsStatusDotComponent,
        OptionTypeBadgeComponent,
        PollItemTimeComponent,
        PollItemVotersComponent,
        DsMenuComponent,
    ],
    templateUrl: './poll-item.component.html',
    styleUrl: './poll-item.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollItemComponent {
    private readonly translateService = inject(TranslateService);

    poll = input.required<PollItem>();
    previewMode = input<boolean>(false);
    isRemoving = input<boolean>(false);
    isSettling = input<boolean>(false);
    showDeleteConfirm = signal(false);
    deletionRequested = output();
    shareRequested = output();
    favoriteToggled = output<string>();

    /** Only owners (and the creator) may share or delete, so only they get the ⋮ menu. */
    readonly canManage = computed(() => this.poll().role >= PollRole.Owner);

    /** Items of the ⋮ menu: Share, then Delete; empty when the user can't manage the poll. */
    readonly menuItems = computed((): MenuItem[] =>
        this.canManage()
            ? [
                  {
                      icon: 'share',
                      label: this.translateService.instant(
                          'project.share.title',
                      ),
                      onClick: () => this.shareRequested.emit(),
                  },
                  {
                      icon: 'trash',
                      label: this.translateService.instant(
                          'project.results.deletePoll',
                      ),
                      danger: true,
                      separatorBefore: true,
                      onClick: () => this.requestDelete(),
                  },
              ]
            : [],
    );

    readonly resultsRoute = computed(() => {
        const poll = this.poll();
        return ['/polls', poll.projectId, poll.pollId];
    });

    /** Undefined when the creator isn't among the participants. */
    readonly creatorVoted = computed(() => {
        const { participants, creatorId } = this.poll();
        const creator = participants.find((p) => p.userId === creatorId);
        return creator && creator.votingStatus !== PollVotingStatus.None;
    });

    /** Everyone but the creator, who is shown separately with a crown. */
    readonly avatarUsers = computed<AvatarUser[]>(() => {
        const { participants, creatorId } = this.poll();
        return participants
            .filter((p) => p.userId !== creatorId)
            .map((p) => ({
                name: p.name,
                voted: p.votingStatus !== PollVotingStatus.None,
            }));
    });

    readonly missingVotersText = computed(() => {
        const missing = this.poll()
            .participants.filter(
                (p) => p.votingStatus === PollVotingStatus.None,
            )
            .map((p) => p.name);

        if (missing.length === 0) {
            return this.translateService.instant('project.pollsTab.allVoted');
        }

        const names =
            missing.length > 3
                ? missing.slice(0, 2).join(', ') + ', +' + (missing.length - 2)
                : missing.join(', ');

        return this.translateService.instant('project.pollsTab.missingVoters', {
            names,
        });
    });

    requestDelete(): void {
        this.showDeleteConfirm.set(true);
    }

    cancelDelete(): void {
        this.showDeleteConfirm.set(false);
    }

    confirmDelete(): void {
        this.showDeleteConfirm.set(false);
        this.deletionRequested.emit();
    }
}
