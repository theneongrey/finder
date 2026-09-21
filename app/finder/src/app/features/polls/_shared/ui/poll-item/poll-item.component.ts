import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PollItem } from '../../models/poll-item.model';
import { PollRole } from '../../models/poll-role.enum';
import { PollVotingStatus } from '../../models/standalone-poll-overview.model';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { DsCardComponent } from '@ds/card/ds-card.component';
import { DsStatusDotComponent } from '@ds/badge/ds-status-dot.component';
import { OptionTypeBadgeComponent } from '@smart/option-type-badge/option-type-badge.component';
import { PollItemTimeComponent } from './poll-item-time/poll-item-time.component';
import { PollItemProgressComponent } from './poll-item-progress/poll-item-progress.component';
import { AvatarUser } from '@smart/avatar-stack/avatar-stack.component';

@Component({
    selector: 'app-poll-item',
    host: {
        '(mouseenter)': 'isHovered.set(true)',
        '(mouseleave)': 'isHovered.set(false)',
        '[class.is-confirming]': 'showDeleteConfirm()',
        '[class.is-removing]': 'isRemoving()',
        '[class.is-settling]': 'isSettling()',
    },
    imports: [
        NgClass,
        RouterLink,
        TranslatePipe,
        DsCardComponent,
        DsButtonComponent,
        DsIconComponent,
        DsStatusDotComponent,
        OptionTypeBadgeComponent,
        PollItemTimeComponent,
        PollItemProgressComponent,
    ],
    templateUrl: './poll-item.component.html',
    styleUrl: './poll-item.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollItemComponent {
    private readonly translateService = inject(TranslateService);

    poll = input.required<PollItem>();
    editMode = input<boolean>(false);
    previewMode = input<boolean>(false);
    isRemoving = input<boolean>(false);
    isSettling = input<boolean>(false);
    isHovered = signal(false);
    showDeleteConfirm = signal(false);
    deletionRequested = output();
    shareRequested = output();
    favoriteToggled = output<string>();

    readonly showActions = computed(
        () => this.poll().role >= PollRole.Maintainer,
    );
    readonly canShare = computed(() => this.poll().role >= PollRole.Owner);

    readonly resultsRoute = computed(() => {
        const poll = this.poll();
        return ['/polls', poll.projectId, poll.pollId];
    });

    readonly votedCountByStatus = computed(
        () =>
            this.poll().participants.filter(
                (p) => p.votingStatus !== PollVotingStatus.None,
            ).length,
    );

    readonly progressPercent = computed(() => {
        const { totalParticipants } = this.poll();
        return totalParticipants > 0
            ? Math.round((this.votedCountByStatus() / totalParticipants) * 100)
            : 0;
    });

    readonly avatarUsers = computed<AvatarUser[]>(() =>
        this.poll().participants.map((p) => ({
            name: p.name,
            voted: p.votingStatus !== PollVotingStatus.None,
        })),
    );

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
