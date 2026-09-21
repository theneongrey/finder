import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    ElementRef,
    inject,
    input,
    OnDestroy,
    output,
    signal,
    viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { PollDetailStore } from '../../_shared/data/poll-detail.store';
import { DateOptionFormatService } from '../../_shared/utils/date-option-format.service';
import { TranslatePipe } from '@ngx-translate/core';
import { VoteProgressHeaderComponent } from './vote-progress-header/vote-progress-header.component';
import { VoteSwipeCardComponent } from './vote-swipe-card/vote-swipe-card.component';
import { VoteCtaAreaComponent } from './vote-cta-area/vote-cta-area.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { OptionType } from '@common/models/option-type.model';

@Component({
    selector: 'app-project-vote',
    templateUrl: './poll-vote.component.html',
    styleUrl: './poll-vote.component.css',
    imports: [
        VoteProgressHeaderComponent,
        VoteSwipeCardComponent,
        VoteCtaAreaComponent,
        DsIconComponent,
        TranslatePipe,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:keyup)': 'onKeyUp($event)',
        '(click)': 'onOverlayClick($event)',
    },
})
export class PollVoteComponent implements OnDestroy {
    private readonly document = inject(DOCUMENT);
    private readonly elementRef = inject(ElementRef);
    private readonly projectDetailStore = inject(PollDetailStore);
    private readonly dateFormat = inject(DateOptionFormatService);

    readonly OptionType = OptionType;

    swipeCardRef = viewChild.required(VoteSwipeCardComponent);
    ctaAreaRef = viewChild.required(VoteCtaAreaComponent);

    pollId = input('');
    /** Option to start voting at; when unset the first pending option is chosen. */
    startOptionId = input<string | undefined>(undefined);
    /** Revote mode cycles through every option once, regardless of prior choice. */
    revote = input(false);

    /** Emitted when the vote flow completes and the overlay should close. */
    finished = output<void>();
    /** Emitted when the user aborts voting (close button / Escape). */
    dismissed = output<void>();

    /** Currently displayed option, tracked internally (no longer routed). */
    readonly currentOptionId = signal('');

    poll = this.projectDetailStore.currentPoll;
    option = computed(() =>
        this.poll()?.options.find((o) => o.id === this.currentOptionId()),
    );
    votedCount = computed(
        () =>
            this.poll()?.options.filter((o) => parseInt(o.choice ?? '0') > 0)
                .length ?? 0,
    );
    totalCount = computed(() => this.poll()?.options.length ?? 0);
    allOptionTexts = computed(
        () => this.poll()?.options.map((o) => o.text) ?? [],
    );
    progressPercent = computed(() =>
        this.totalCount() > 0
            ? Math.round((this.votedCount() / this.totalCount()) * 100)
            : 0,
    );

    currentOptionIndex = computed(() => {
        const options = this.poll()?.options ?? [];
        const idx = options.findIndex((o) => o.id === this.currentOptionId());
        return idx >= 0 ? idx : 0;
    });

    progressSegments = computed(() => {
        const options = this.poll()?.options ?? [];
        const currentId = this.currentOptionId();
        return options.map((o) => {
            if (parseInt(o.choice ?? '0') > 0) {
                return 'var(--accent)';
            }
            if (o.id === currentId) {
                return '#9fc2cf';
            }
            return '#e2ded7';
        });
    });

    closeDateDisplay = computed(() => {
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

    private readonly localSkipCounts = signal(new Map<string, number>());
    private readonly hasVotedInSession = signal(false);
    private readonly visitedInRevote = signal(new Set<string>());

    constructor() {
        this.document.body.style.overflow = 'hidden';
        effect(() => {
            this.projectDetailStore.getPoll(this.pollId());
        });
        // Pick the first option to show once the poll is loaded. Honour an
        // explicit start option (single-option / revote-from-card), otherwise
        // fall back to the standard "next pending option" selection.
        effect(() => {
            const poll = this.poll();
            if (poll && !this.currentOptionId()) {
                const start = this.startOptionId();
                if (start) {
                    this.currentOptionId.set(start);
                } else {
                    this.goToNextOption(undefined);
                }
            }
        });
    }

    ngOnDestroy(): void {
        this.document.body.style.overflow = '';
    }

    /** Dismiss when the backdrop around the vote content is clicked. */
    onOverlayClick(event: MouseEvent): void {
        if (event.target === this.elementRef.nativeElement) {
            this.dismissed.emit();
        }
    }

    onVoted(goRight: boolean): void {
        const isRating = this.poll()?.optionType === OptionType.Rating;
        const choice = isRating ? (goRight ? '5' : '1') : goRight ? '1' : '2';
        this.castVote(choice);
    }

    onRated(stars: number): void {
        this.castVote(stars.toString());
    }

    skip(): void {
        const optionId = this.currentOptionId();
        const currentChoice = parseInt(this.option()?.choice ?? '0') || 0;
        const skipValue = Math.min(currentChoice, 0) - 1;
        this.projectDetailStore.vote({
            optionId,
            choice: skipValue.toString(),
        });

        if (this.revote()) {
            this.visitedInRevote.update((s) => new Set([...s, optionId]));
        } else {
            const counts = new Map(this.localSkipCounts());
            counts.set(optionId, (counts.get(optionId) ?? 0) + 1);
            this.localSkipCounts.set(counts);
        }

        this.goToNextOption(optionId);
    }

    onKeyDown(event: KeyboardEvent): void {
        if (
            event.target instanceof HTMLInputElement ||
            event.target instanceof HTMLTextAreaElement
        ) {
            return;
        }
        if (event.key === 'Escape') {
            this.dismissed.emit();
            return;
        }
        const isRating = this.poll()?.optionType === OptionType.Rating;
        if (isRating) {
            const digit = parseInt(event.key);
            if (digit >= 1 && digit <= 5) {
                this.ctaAreaRef().setHoveredStar(digit);
            }
        } else {
            if (event.key === 'ArrowRight') {
                this.swipeCardRef().swipeYes();
            } else if (event.key === 'ArrowLeft') {
                this.swipeCardRef().swipeNo();
            }
        }
    }

    onKeyUp(event: KeyboardEvent): void {
        if (
            event.target instanceof HTMLInputElement ||
            event.target instanceof HTMLTextAreaElement
        ) {
            return;
        }
        if (this.poll()?.optionType !== OptionType.Rating) {
            return;
        }
        const digit = parseInt(event.key);
        if (digit >= 1 && digit <= 5) {
            this.ctaAreaRef().clearHoveredStar();
            this.ctaAreaRef().castRating(digit);
        }
    }

    private castVote(choice: string): void {
        this.hasVotedInSession.set(true);
        if (this.revote()) {
            this.visitedInRevote.update(
                (s) => new Set([...s, this.currentOptionId()]),
            );
        }
        this.projectDetailStore.vote({
            optionId: this.currentOptionId(),
            choice,
        });
        this.goToNextOption(this.currentOptionId());
    }

    // Selection priority rules:
    //   choice == null  → never touched; always shown first
    //   choice  > 0     → real vote; never shown again
    //   choice  < 0     → skipped; shown after unvoted, but an option skipped
    //                     twice locally is treated as done for this session and
    //                     excluded from the queue.
    // In revote mode (entered via "erneut abstimmen"): all options are cycled
    //   through once regardless of prior choice, tracked via visitedInRevote.
    // When no option remains the flow is complete → `finished` closes the overlay.
    private goToNextOption(ignore: string | undefined): void {
        const options = this.poll()!.options;

        if (this.revote()) {
            const next = options.find(
                (o) => o.id !== ignore && !this.visitedInRevote().has(o.id),
            );
            if (next) {
                this.currentOptionId.set(next.id);
                return;
            }
            this.finished.emit();
            return;
        }

        const nextUnvoted = options.find((o) => !o.choice && o.id !== ignore);
        if (nextUnvoted) {
            this.currentOptionId.set(nextUnvoted.id);
            return;
        }

        // No unvoted options remain — show skipped ones regardless of session state,
        // since the user has clearly engaged with the poll before (all options touched).
        const nextSkipped = [...options]
            .filter(
                (o) =>
                    o.id !== ignore &&
                    parseInt(o.choice ?? '0') < 0 &&
                    (this.localSkipCounts().get(o.id) ?? 0) < 2,
            )
            .sort((a, b) => parseInt(b.choice!) - parseInt(a.choice!))[0];
        if (nextSkipped) {
            this.currentOptionId.set(nextSkipped.id);
            return;
        }

        this.finished.emit();
    }
}
