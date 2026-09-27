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
import { extractSlugId } from '../../../_shared/utils/slug.utils';
import {
    isDateOptionType,
    optionTypeToDateType,
} from '../../../_shared/models/date-option.model';
import * as voteTally from '../../../_shared/utils/vote-tally.utils';
import {
    HIGHLIGHT_DURATION_MS,
    OptionChangeKind,
} from '../../../_shared/data/poll-realtime-sync.feature';

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
    /** Whether the current user may edit/delete options (Maintainer+); gates the per-card edit UI. */
    canManage = input(false);
    /** Options changed by a recent remote update, keyed by id → change kind (added/updated/removed). */
    changedOptions = input<Record<string, OptionChangeKind>>({});
    protected readonly highlightDurationMs = HIGHLIGHT_DURATION_MS;

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

    changeKind(option: OptionDetail): OptionChangeKind | undefined {
        return this.changedOptions()[option.id];
    }

    /** Track by the stable slug id so a title edit updates the card in place (the full slug, which
     *  encodes the title, changes on rename and would otherwise remount the card). */
    trackOption(option: OptionDetail): string {
        return extractSlugId(option.id);
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
