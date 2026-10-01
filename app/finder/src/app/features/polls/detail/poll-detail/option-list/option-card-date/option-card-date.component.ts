import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DsCardComponent } from '@ds/card/ds-card.component';
import { MenuItem } from '@ds/menu/ds-menu.component';
import {
    OptionDetail,
    SharedWith,
} from '../../../../_shared/models/poll-detail.model';
import { DateOptionFormatService } from '../../../../_shared/utils/date-option-format.service';
import { DateOptionType } from '../../../../_shared/models/date-option.model';
import * as voteTally from '../../../../_shared/utils/vote-tally.utils';
import { SwipeVoteCardComponent } from '../swipe-vote-card/swipe-vote-card.component';
import { OptionCardFooterComponent } from '../option-card-footer/option-card-footer.component';
import { OptionCardMenuComponent } from '../option-card-menu/option-card-menu.component';
import { optionMenuItems } from '../option-card-menu/option-menu-items';

@Component({
    selector: 'app-option-card-date',
    templateUrl: './option-card-date.component.html',
    imports: [
        DsCardComponent,
        SwipeVoteCardComponent,
        OptionCardFooterComponent,
        OptionCardMenuComponent,
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
    /** Closed polls take no votes: inline voting, swiping and reset are disabled. */
    isClosed = input(false);
    /** Whether the current user may delete this option (Maintainer+). */
    canManage = input(false);

    commentsClick = output<void>();
    vote = output<{ optionId: string; choice: string }>();
    deleteOption = output<{ optionId: string }>();

    protected readonly deleteConfirm = signal(false);

    private readonly parsed = computed(() =>
        this.dateFormatService.parse(this.option().text, this.dateType()),
    );

    readonly label = computed(() =>
        this.dateFormatService.labelFromEntry(this.parsed()),
    );
    readonly subLabel = computed(() =>
        this.dateFormatService.subLabelFromEntry(this.parsed()),
    );

    readonly voteLine = computed(() => {
        const option = this.option();
        const yes = voteTally.yesVotes(option).length;
        const maybe = voteTally.maybeVotes(option).length;
        const no = voteTally.noVotes(option).length;
        if (!yes && !maybe && !no) {
            return this.translate.instant('project.results.noVotes');
        }
        return this.translate.instant('project.results.voteLineDate', {
            yes,
            maybe,
            no,
        });
    });

    readonly menuItems = computed((): MenuItem[] =>
        optionMenuItems(this.translate, {
            resetVote:
                !this.isClosed() && voteTally.hasVoted(this.option().choice)
                    ? () =>
                          this.castVote(
                              voteTally.resetChoice(this.option().choice),
                          )
                    : undefined,
            delete: this.canManage()
                ? () => this.deleteConfirm.set(true)
                : undefined,
        }),
    );

    protected castVote(choice: string): void {
        this.vote.emit({ optionId: this.option().id, choice });
    }

    /** Swipe right = yes, left = no — as in the vote overlay. */
    protected onSwiped(right: boolean): void {
        this.castVote(right ? '1' : '2');
    }

    protected confirmDelete(): void {
        this.deleteOption.emit({ optionId: this.option().id });
        this.deleteConfirm.set(false);
    }
}
