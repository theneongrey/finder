import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsCardComponent } from '@ds/card/ds-card.component';
import {
    ResultsProgressBarComponent,
    ProgressSegment,
} from '../results-progress-bar/results-progress-bar.component';
import {
    AvatarStackComponent,
    AvatarUser,
} from '@smart/avatar-stack/avatar-stack.component';
import { UserAvatarComponent } from '@smart/user-avatar/user-avatar.component';
import {
    OptionDetail,
    SharedWith,
} from '../../../../_shared/models/poll-detail.model';
import { DateOptionFormatService } from '../../../../_shared/utils/date-option-format.service';

@Component({
    selector: 'app-option-card-date',
    templateUrl: './option-card-date.component.html',
    imports: [
        RouterLink,
        DsButtonComponent,
        DsCardComponent,
        ResultsProgressBarComponent,
        AvatarStackComponent,
        UserAvatarComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardDateComponent {
    private readonly dateFormatService = inject(DateOptionFormatService);

    option = input.required<OptionDetail>();
    members = input<SharedWith[]>([]);
    commentCount = input(0);
    isMostVoted = input(false);
    projectId = input('');
    pollId = input('');
    hideResults = input(false);

    commentsClick = output<void>();

    private readonly parsed = computed(() =>
        this.dateFormatService.parse(this.option().text),
    );

    readonly label = computed(() =>
        this.dateFormatService.labelFromEntry(this.parsed()),
    );
    readonly subLabel = computed(() =>
        this.dateFormatService.subLabelFromEntry(this.parsed()),
    );

    readonly yesVotes = computed(() =>
        this.option().votes.filter((v) => v.choice === '1'),
    );

    readonly maybeVotes = computed(() =>
        this.option().votes.filter((v) => v.choice === '3'),
    );

    readonly noVotes = computed(() =>
        this.option().votes.filter((v) => v.choice === '2'),
    );

    readonly totalVoters = computed(
        () =>
            this.option().votes.filter((v) => parseInt(v.choice ?? '0') > 0)
                .length,
    );

    readonly segments = computed((): ProgressSegment[] => {
        const total = this.totalVoters();
        if (!total) {
            return [];
        }
        return [
            {
                percent: (this.yesVotes().length / total) * 100,
                color: 'var(--positive-strong)',
            },
            {
                percent: (this.maybeVotes().length / total) * 100,
                color: '#e0b45c',
            },
            {
                percent: (this.noVotes().length / total) * 100,
                color: '#e3a7a2',
            },
        ].filter((s) => s.percent > 0);
    });

    readonly voteLine = computed(() => {
        const yes = this.yesVotes().length;
        const maybe = this.maybeVotes().length;
        const no = this.noVotes().length;
        if (!yes && !maybe && !no) {
            return 'Keine Stimmen';
        }
        const parts = [
            `${yes} × kann`,
            `${maybe} × vielleicht`,
            `${no} × kann nicht`,
        ];
        return parts.join(' · ');
    });

    readonly avatarUsers = computed((): AvatarUser[] => {
        const voted = this.votedNames();
        const members = this.members();
        if (members.length) {
            return members.map((m) => ({
                name: m.name,
                voted: voted.has(m.name),
            }));
        }
        return this.option().votes.map((v) => ({
            name: v.person,
            voted: parseInt(v.choice ?? '0') > 0,
        }));
    });

    private readonly votedNames = computed(
        () =>
            new Set(
                this.option()
                    .votes.filter((v) => parseInt(v.choice ?? '0') > 0)
                    .map((v) => v.person),
            ),
    );
}
