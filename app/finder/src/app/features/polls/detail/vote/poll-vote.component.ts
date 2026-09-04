import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    input,
    OnDestroy,
    signal,
    viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PollDetailStore } from '../../_shared/data/poll-detail.store';
import { DateOptionFormatService } from '../../_shared/utils/date-option-format.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarService } from '@common/services/title-bar.service';
import { VoteSidebarComponent } from './vote-sidebar/vote-sidebar.component';
import { VoteProgressHeaderComponent } from './vote-progress-header/vote-progress-header.component';
import { VoteSwipeCardComponent } from './vote-swipe-card/vote-swipe-card.component';
import { VoteCtaAreaComponent } from './vote-cta-area/vote-cta-area.component';
import { OptionType } from '@common/models/option-type.model';
import { UserStore } from '@common/data/user.store';

@Component({
    selector: 'app-project-vote',
    templateUrl: './poll-vote.component.html',
    styleUrl: './poll-vote.component.css',
    imports: [
        VoteSidebarComponent,
        VoteProgressHeaderComponent,
        VoteSwipeCardComponent,
        VoteCtaAreaComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:keyup)': 'onKeyUp($event)',
    },
})
export class PollVoteComponent implements OnDestroy {
    private readonly document = inject(DOCUMENT);
    private readonly titleService = inject(TitleBarService);
    private readonly translateService = inject(TranslateService);
    private readonly projectDetailStore = inject(PollDetailStore);
    private readonly dateFormat = inject(DateOptionFormatService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    readonly OptionType = OptionType;

    swipeCardRef = viewChild.required(VoteSwipeCardComponent);
    ctaAreaRef = viewChild.required(VoteCtaAreaComponent);

    projectId = this.projectDetailStore.projectId;
    pollId = input('');
    optionId = input('');
    poll = this.projectDetailStore.currentPoll;
    option = computed(() =>
        this.poll()?.options.find((o) => o.id === this.optionId()),
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
        const idx = options.findIndex((o) => o.id === this.optionId());
        return idx >= 0 ? idx : 0;
    });

    progressSegments = computed(() => {
        const options = this.poll()?.options ?? [];
        const currentId = this.optionId();
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
    private readonly revoteMode = signal(false);
    private readonly visitedInRevote = signal(new Set<string>());

    constructor() {
        this.document.body.style.overflow = 'hidden';
        if (this.route.snapshot.queryParamMap.get('revote')) {
            this.revoteMode.set(true);
        }
        this.translateService
            .stream('project.pollsTab.title')
            .pipe(takeUntilDestroyed())
            .subscribe((label: string) => {
                this.titleService.setSubtitle(label);
            });
        effect(() => {
            this.projectDetailStore.getPoll(this.pollId());
        });
        effect(() => {
            const currentProject = this.projectDetailStore.currentProject();
            if (currentProject) {
                this.titleService.setTitle(currentProject.name);
            }
        });
        effect(() => {
            const poll = this.poll();

            if (poll && this.projectId()) {
                if (!this.optionId()) {
                    this.navigateToNextOption(undefined, true);
                }
            }
        });
    }

    ngOnDestroy(): void {
        this.document.body.style.overflow = '';
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
        const optionId = this.optionId();
        const currentChoice = parseInt(this.option()?.choice ?? '0') || 0;
        const skipValue = Math.min(currentChoice, 0) - 1;
        this.projectDetailStore.vote({
            optionId,
            choice: skipValue.toString(),
        });

        if (this.revoteMode()) {
            this.visitedInRevote.update((s) => new Set([...s, optionId]));
        } else {
            const counts = new Map(this.localSkipCounts());
            counts.set(optionId, (counts.get(optionId) ?? 0) + 1);
            this.localSkipCounts.set(counts);
        }

        this.navigateToNextOption(optionId);
    }

    onKeyDown(event: KeyboardEvent): void {
        if (
            event.target instanceof HTMLInputElement ||
            event.target instanceof HTMLTextAreaElement
        ) {
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
        if (this.revoteMode()) {
            this.visitedInRevote.update(
                (s) => new Set([...s, this.optionId()]),
            );
        }
        this.projectDetailStore.vote({ optionId: this.optionId(), choice });
        this.navigateToNextOption(this.optionId());
    }

    // Navigation priority rules:
    //   choice == null  → never touched; always shown first
    //   choice  > 0     → real vote; never shown again
    //   choice  < 0     → skipped; shown after unvoted, but only when at least one
    //                     real vote was cast this session (otherwise go to overview)
    //                     An option skipped twice locally is treated as done for
    //                     this session and excluded from the queue.
    // In revote mode (entered via "erneut abstimmen"): all options are cycled
    //   through once regardless of prior choice, tracked via visitedInRevote.
    private navigateToNextOption(
        ignore: string | undefined,
        replaceUrl = false,
    ): void {
        const options = this.poll()!.options;

        if (this.revoteMode()) {
            const next = options.find(
                (o) => o.id !== ignore && !this.visitedInRevote().has(o.id),
            );
            if (next) {
                void this.router.navigate(
                    [
                        '/polls/',
                        this.projectId(),
                        'vote',
                        this.pollId()!,
                        next.id,
                    ],
                    { replaceUrl, queryParamsHandling: 'preserve' },
                );
                return;
            }
            void this.router.navigate(
                ['/polls/', this.projectId(), 'results', this.pollId()!],
                { replaceUrl },
            );
            return;
        }

        const nextUnvoted = options.find((o) => !o.choice && o.id !== ignore);
        if (nextUnvoted) {
            void this.router.navigate(
                [
                    '/polls/',
                    this.projectId(),
                    'vote',
                    this.pollId()!,
                    nextUnvoted.id,
                ],
                { replaceUrl },
            );
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
            void this.router.navigate(
                [
                    '/polls/',
                    this.projectId(),
                    'vote',
                    this.pollId()!,
                    nextSkipped.id,
                ],
                { replaceUrl },
            );
            return;
        }

        void this.router.navigate(
            ['/polls/', this.projectId(), 'results', this.pollId()!],
            { replaceUrl },
        );
    }
}
