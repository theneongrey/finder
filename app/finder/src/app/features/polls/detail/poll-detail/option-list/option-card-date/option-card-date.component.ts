import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    output,
} from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
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
import { DateOptionType } from '../../../../_shared/models/date-option.model';
import * as voteTally from '../../../../_shared/utils/vote-tally.utils';

@Component({
    selector: 'app-option-card-date',
    templateUrl: './option-card-date.component.html',
    imports: [
        TranslatePipe,
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
    private readonly translate = inject(TranslateService);

    option = input.required<OptionDetail>();
    dateType = input.required<DateOptionType>();
    members = input<SharedWith[]>([]);
    commentCount = input(0);
    isMostVoted = input(false);
    projectId = input('');
    pollId = input('');
    hideResults = input(false);

    commentsClick = output<void>();
    startVote = output<{ optionId: string; revote: boolean }>();

    private readonly parsed = computed(() =>
        this.dateFormatService.parse(this.option().text, this.dateType()),
    );

    readonly label = computed(() =>
        this.dateFormatService.labelFromEntry(this.parsed()),
    );
    readonly subLabel = computed(() =>
        this.dateFormatService.subLabelFromEntry(this.parsed()),
    );

    readonly yesVotes = computed(() => voteTally.yesVotes(this.option()));

    readonly maybeVotes = computed(() => voteTally.maybeVotes(this.option()));

    readonly noVotes = computed(() => voteTally.noVotes(this.option()));

    readonly totalVoters = computed(() => voteTally.totalVoters(this.option()));

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
                color: 'var(--positive-maybe)',
            },
            {
                percent: (this.noVotes().length / total) * 100,
                color: 'var(--negative-soft)',
            },
        ].filter((s) => s.percent > 0);
    });

    readonly voteLine = computed(() => {
        const yes = this.yesVotes().length;
        const maybe = this.maybeVotes().length;
        const no = this.noVotes().length;
        if (!yes && !maybe && !no) {
            return this.translate.instant('project.results.noVotes');
        }
        return this.translate.instant('project.results.voteLineDate', {
            yes,
            maybe,
            no,
        });
    });

    readonly avatarUsers = computed((): AvatarUser[] =>
        voteTally.avatarUsers(this.option(), this.members()),
    );
}
