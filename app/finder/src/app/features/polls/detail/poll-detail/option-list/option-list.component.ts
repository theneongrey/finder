import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    output,
} from '@angular/core';
import {
    Comment,
    OptionDetail,
    SharedWith,
} from '../../../_shared/models/poll-detail.model';
import { OptionCardComponent } from './option-card/option-card.component';
import { OptionCardDateComponent } from './option-card-date/option-card-date.component';
import { OptionType } from '@common/models/option-type.model';
import {
    isDateOptionType,
    optionTypeToDateType,
} from '../../../_shared/models/date-option.model';
import * as voteTally from '../../../_shared/utils/vote-tally.utils';

type SortMode = 'top' | 'original';

@Component({
    selector: 'app-option-list',
    templateUrl: './option-list.component.html',
    styleUrl: './option-list.component.css',
    imports: [OptionCardComponent, OptionCardDateComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionListComponent {
    readonly OptionType = OptionType;

    options = input.required<OptionDetail[]>();
    members = input<SharedWith[]>([]);
    comments = input<Comment[]>([]);
    projectId = input('');
    pollId = input('');
    optionType = input(OptionType.YesNo);
    hideResults = input(false);
    isClosed = input(false);
    /** Ids of options changed by a recent remote update — briefly highlighted. */
    changedOptionIds = input<string[]>([]);

    sort = input<SortMode>('top');

    readonly isDateType = computed(() => isDateOptionType(this.optionType()));
    readonly dateType = computed(() => optionTypeToDateType(this.optionType()));

    openComments = output<OptionDetail>();
    startVote = output<{ optionId: string; revote: boolean }>();
    saveEdit = output<{
        optionId: string;
        text: string;
        description: string;
    }>();
    deleteOption = output<{ optionId: string }>();
    editStart = output<{ optionId: string }>();
    editEnd = output<{ optionId: string }>();

    isChanged(option: OptionDetail): boolean {
        return this.changedOptionIds().includes(option.id);
    }

    private readonly commentCountByOption = computed(() => {
        const counts = new Map<string, number>();
        for (const comment of this.comments()) {
            if (comment.optionId) {
                counts.set(
                    comment.optionId,
                    (counts.get(comment.optionId) ?? 0) + 1,
                );
            }
        }
        return counts;
    });

    commentCount(option: OptionDetail): number {
        return this.commentCountByOption().get(option.id) ?? 0;
    }

    sortedOptions = computed(() => {
        const opts = [...this.options()];
        if (this.hideResults()) {
            return opts;
        }
        // "Nach Reihenfolge" shows the options in reverse (newest first).
        if (this.sort() !== 'top') {
            return opts.reverse();
        }
        return opts.sort((a, b) =>
            this.optionType() === OptionType.Rating
                ? voteTally.averageRating(b) - voteTally.averageRating(a)
                : voteTally.yesVotes(b).length - voteTally.yesVotes(a).length,
        );
    });

    private readonly topScore = computed(() => {
        const opts = this.options();
        if (this.optionType() === OptionType.Rating) {
            return Math.max(0, ...opts.map((o) => voteTally.averageRating(o)));
        }
        return Math.max(0, ...opts.map((o) => voteTally.yesVotes(o).length));
    });

    hasMostVotes(option: OptionDetail): boolean {
        const top = this.topScore();
        if (!top) {
            return false;
        }
        if (this.optionType() === OptionType.Rating) {
            return voteTally.averageRating(option) === top;
        }
        return voteTally.yesVotes(option).length === top;
    }
}
