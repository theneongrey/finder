import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PollDetailStore } from '../../../_shared/data/poll-detail.store';
import { DateOptionFormatService } from '../../../_shared/utils/date-option-format.service';
import { AvatarStackComponent } from '@smart/avatar-stack/avatar-stack.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import {
    VoteAnswerSummaryComponent,
    AnswerSummaryItem,
} from './vote-answer-summary/vote-answer-summary.component';
import { OptionType } from '@common/models/option-type.model';
import { OptionTypeBadgeComponent } from '@smart/option-type-badge/option-type-badge.component';

@Component({
    selector: 'app-vote-sidebar',
    templateUrl: './vote-sidebar.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        TranslatePipe,
        OptionTypeBadgeComponent,
        AvatarStackComponent,
        DsIconComponent,
        VoteAnswerSummaryComponent,
    ],
    host: { style: 'display: contents' },
})
export class VoteSidebarComponent {
    private readonly store = inject(PollDetailStore);
    private readonly dateFormat = inject(DateOptionFormatService);
    private readonly router = inject(Router);

    pollId = input('');
    optionId = input('');

    readonly OptionType = OptionType;
    readonly poll = this.store.currentPoll;
    private readonly projectId = this.store.projectId;

    readonly closeDateDisplay = computed(() => {
        const d = this.poll()?.closeDate;
        if (!d) {
            return undefined;
        }
        try {
            return this.dateFormat.formatCloseDate(d);
        } catch {
            return d;
        }
    });

    readonly memberVoteStatus = computed(() => {
        const members = this.store.currentProject()?.sharedWith ?? [];
        const options = this.poll()?.options ?? [];
        const votedNames = new Set<string>();
        for (const opt of options) {
            for (const v of opt.votes) {
                if (parseInt(v.choice) > 0) {
                    votedNames.add(v.person);
                }
            }
        }
        return members.map((m) => ({
            name: m.name,
            picture: m.picture,
            hasVoted: votedNames.has(m.name),
        }));
    });

    readonly memberAvatars = computed(() =>
        this.memberVoteStatus().map((m) => ({
            name: m.name,
            voted: m.hasVoted,
        })),
    );

    readonly votedMemberCount = computed(
        () => this.memberVoteStatus().filter((m) => m.hasVoted).length,
    );

    readonly answerSummary = computed((): AnswerSummaryItem[] => {
        const options = this.poll()?.options ?? [];
        const type = this.poll()?.optionType ?? OptionType.YesNo;
        const currentId = this.optionId();
        const isDate = type === OptionType.Date;
        const isRating = type === OptionType.Rating;
        return options.map((o) => {
            const choiceNum = parseInt(o.choice ?? '0');
            const isPositive = choiceNum > 0;
            let badgeBg = '#f1eee9',
                badgeFg = '#8a8681',
                dotBg = '#d2cdc6';
            let badgeKey = 'project.vote.answerOpen';
            let ratingValue = 0;
            if (isRating && isPositive) {
                ratingValue = choiceNum;
                badgeBg = 'var(--star-bg)';
                badgeFg = 'var(--star-fg)';
                dotBg = 'var(--star)';
            } else if (choiceNum === 1) {
                badgeKey = isDate
                    ? 'project.vote.stampCan'
                    : 'project.votesOverview.voteLabel.yes';
                badgeBg = '#e2ede1';
                badgeFg = '#3f7a4e';
                dotBg = '#5d9a56';
            } else if (choiceNum === 2) {
                badgeKey = isDate
                    ? 'project.vote.stampCannot'
                    : 'project.votesOverview.voteLabel.no';
                badgeBg = '#fdf3f1';
                badgeFg = '#c1453f';
                dotBg = '#c1453f';
            }
            const isCurrent = o.id === currentId;
            return {
                id: o.id,
                label: isDate ? this.dateFormat.formatLabel(o.text) : o.text,
                badgeBg,
                badgeFg,
                dotBg,
                badgeKey,
                ratingValue,
                rowBg:
                    isCurrent && !isPositive
                        ? 'rgba(31,122,140,.06)'
                        : 'transparent',
                fontWeight: isCurrent ? '700' : '600',
            };
        });
    });

    navigateToOption(id: string): void {
        void this.router.navigate([
            '/polls/',
            this.projectId(),
            'vote',
            this.pollId(),
            id,
        ]);
    }
}
