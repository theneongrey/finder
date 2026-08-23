import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { PollDetailStore } from '../../_shared/data/poll-detail.store';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { VoteCardImageComponent } from './vote-card-image/vote-card-image.component';
import { VoteCardTextComponent } from './vote-card-text/vote-card-text.component';
import { VoteCardDateComponent } from './vote-card-date/vote-card-date.component';
import { VoteCardRatingComponent } from './vote-card-rating/vote-card-rating.component';
import { VoteCommentButtonComponent } from './vote-comment-button/vote-comment-button.component';
import { TitleBarService } from '../../../../common/services/title-bar.service';
import { OptionType } from '../../_shared/models/poll-detail.model';
import { DsVoteButtonsComponent } from '../../../../common/ui/ds-components/vote-buttons/ds-vote-buttons.component';
import { DsButtonComponent } from '../../../../common/ui/ds-components/button/ds-button.component';
import { DsIconComponent } from '../../../../common/ui/ds-components/icon/ds-icon.component';
import { DsCardComponent } from '../../../../common/ui/ds-components/card/ds-card.component';

@Component({
  selector: 'app-project-vote',
  templateUrl: './project-vote.component.html',
  styleUrl: './project-vote.component.css',
  imports: [
    TranslatePipe,
    VoteCardImageComponent,
    VoteCardTextComponent,
    VoteCardDateComponent,
    VoteCommentButtonComponent,
    VoteCardRatingComponent,
    DsVoteButtonsComponent,
    DsButtonComponent,
    DsIconComponent,
    DsCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:mouseup)': 'onDragEnd()',
    '(window:touchend)': 'onDragEnd()',
    '(window:mousemove)': 'onDragMove($event)',
    '(window:touchmove)': 'onDragMove($event)',
  },
})
export class ProjectVoteComponent implements AfterViewInit {
  private readonly titleService = inject(TitleBarService);
  private readonly projectDetailStore = inject(PollDetailStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly OptionType = OptionType;

  voteCardRef = viewChild.required<ElementRef<HTMLElement>>('voteCard');

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

  optionTypeLabelKey = computed(() => {
    switch (this.poll()?.optionType) {
      case OptionType.Rating: return 'project.vote.optionType.rating';
      case OptionType.Date: return 'project.vote.optionType.date';
      default: return 'project.vote.optionType.yesno';
    }
  });

  progressSegments = computed(() => {
    const options = this.poll()?.options ?? [];
    const currentId = this.optionId();
    return options.map((o) => {
      if (parseInt(o.choice ?? '0') > 0) return 'var(--accent)';
      if (o.id === currentId) return '#9fc2cf';
      return '#e2ded7';
    });
  });

  closeDateDisplay = computed(() => {
    const d = this.poll()?.closeDate;
    if (!d) return undefined;
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  });

  memberVoteStatus = computed(() => {
    const members = this.projectDetailStore.currentProject()?.sharedWith ?? [];
    const options = this.poll()?.options ?? [];
    const votedNames = new Set<string>();
    for (const opt of options) {
      for (const v of opt.votes) {
        if (parseInt(v.choice) > 0) votedNames.add(v.person);
      }
    }
    return members.map((m) => ({ name: m.name, picture: m.picture, hasVoted: votedNames.has(m.name) }));
  });

  answerSummary = computed(() => {
    const options = this.poll()?.options ?? [];
    const type = this.poll()?.optionType ?? OptionType.YesNo;
    const currentId = this.optionId();
    const isDate = type === OptionType.Date;
    const isRating = type === OptionType.Rating;
    return options.map((o) => {
      const choiceNum = parseInt(o.choice ?? '0');
      const isPositive = choiceNum > 0;
      let badgeBg = '#f1eee9', badgeFg = '#8a8681', dotBg = '#d2cdc6';
      let badgeKey = 'project.vote.answerOpen';
      let ratingValue = 0;
      if (isRating && isPositive) {
        ratingValue = choiceNum;
        badgeBg = '#f9edd5'; badgeFg = '#a8742a'; dotBg = '#e0a42c';
      } else if (choiceNum === 1) {
        badgeKey = isDate ? 'project.vote.stampCan' : 'project.votesOverview.voteLabel.yes';
        badgeBg = '#e2ede1'; badgeFg = '#3f7a4e'; dotBg = '#5d9a56';
      } else if (choiceNum === 2) {
        badgeKey = isDate ? 'project.vote.stampCannot' : 'project.votesOverview.voteLabel.no';
        badgeBg = '#fdf3f1'; badgeFg = '#c1453f'; dotBg = '#c1453f';
      }
      const isCurrent = o.id === currentId;
      return {
        id: o.id, label: o.text,
        badgeBg, badgeFg, dotBg, badgeKey, ratingValue,
        isCurrent,
        rowBg: isCurrent && !isPositive ? 'rgba(31,122,140,.06)' : 'transparent',
        fontWeight: isCurrent ? '700' : '600',
      };
    });
  });

  private readonly SWIPE_THRESHOLD = 75;

  private startX = 0;
  private isDragging = false;
  private currentDragX = 0;
  private swipeInProgress = false;

  cardTransform = signal('');
  cardTransition = signal('');
  cardOpacity = signal(1);
  leftCueOpacity = signal(0);
  rightCueOpacity = signal(0);
  showHint = signal(!sessionStorage.getItem('finder_voted_session'));
  hintFading = signal(false);
  pendingRating = signal<number | undefined>(undefined);

  private readonly localSkipCounts = signal(new Map<string, number>());
  private readonly hasVotedInSession = signal(false);
  private readonly revoteMode = signal(false);
  private readonly visitedInRevote = signal(new Set<string>());

  constructor() {
    if (this.route.snapshot.queryParamMap.get('revote')) {
      this.revoteMode.set(true);
    }
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
      this.optionId();
      this.resetCardState();
    });
    effect(() => {
      if (this.projectId()) {
        if (!this.optionId()) {
          this.navigateToNextOption(undefined, true);
        }
      }
    });
  }

  ngAfterViewInit(): void {
    this.voteCardRef().nativeElement.addEventListener(
      'touchmove',
      (e) => {
        if (this.isDragging) {
          e.preventDefault();
        }
      },
      { passive: false },
    );
  }

  onDragStart(event: MouseEvent | TouchEvent): void {
    if (this.swipeInProgress) {
      return;
    }
    this.isDragging = true;
    this.startX =
      event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    this.cardTransition.set('none');
  }

  onDragMove(event: MouseEvent | TouchEvent): void {
    if (!this.isDragging) {
      return;
    }
    const clientX =
      event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    this.currentDragX = clientX - this.startX;
    const rotation = this.currentDragX / 15;
    this.cardTransform.set(
      `translateX(${this.currentDragX}px) rotate(${rotation}deg)`,
    );

    if (Math.abs(this.currentDragX) >= this.SWIPE_THRESHOLD / 2) {
      this.dismissHint();
    }

    if (this.currentDragX > 50) {
      this.rightCueOpacity.set(Math.min((this.currentDragX - 50) / 100, 1));
      this.leftCueOpacity.set(0);
    } else if (this.currentDragX < -50) {
      this.leftCueOpacity.set(
        Math.min((Math.abs(this.currentDragX) - 50) / 100, 1),
      );
      this.rightCueOpacity.set(0);
    } else {
      this.leftCueOpacity.set(0);
      this.rightCueOpacity.set(0);
    }
  }

  onDragEnd(): void {
    if (!this.isDragging) {
      return;
    }
    this.isDragging = false;

    if (Math.abs(this.currentDragX) > this.SWIPE_THRESHOLD) {
      this.animateAndVote(this.currentDragX > 0);
    } else {
      this.cardTransition.set(
        'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      );
      this.cardTransform.set('');
      this.leftCueOpacity.set(0);
      this.rightCueOpacity.set(0);
    }
  }

  swipeYes(): void {
    this.animateAndVote(true);
  }

  swipeNo(): void {
    this.animateAndVote(false);
  }

  castRating(stars: number): void {
    this.castVote(stars.toString());
  }

  submitRating(): void {
    const r = this.pendingRating();
    if (r !== undefined) {
      this.castRating(r);
    }
  }

  skip(): void {
    const optionId = this.optionId();
    const currentChoice = parseInt(this.option()?.choice ?? '0') || 0;
    const skipValue = Math.min(currentChoice, 0) - 1;
    this.projectDetailStore.vote({ optionId, choice: skipValue.toString() });

    if (this.revoteMode()) {
      this.visitedInRevote.update((s) => new Set([...s, optionId]));
    } else {
      const counts = new Map(this.localSkipCounts());
      counts.set(optionId, (counts.get(optionId) ?? 0) + 1);
      this.localSkipCounts.set(counts);
    }

    this.navigateToNextOption(optionId);
  }

  navigateToOption(id: string): void {
    void this.router.navigate(['/polls/', this.projectId(), 'vote', this.pollId(), id]);
  }

  dismissHint(): void {
    if (!this.showHint() || this.hintFading()) {
      return;
    }
    sessionStorage.setItem('finder_voted_session', '1');
    this.hintFading.set(true);
    setTimeout(() => this.showHint.set(false), 300);
  }

  private animateAndVote(goRight: boolean): void {
    if (this.swipeInProgress) {
      return;
    }
    this.dismissHint();
    const direction = goRight ? 1 : -1;
    this.swipeInProgress = true;
    this.cardTransition.set('transform 0.5s ease-in, opacity 0.5s ease-in');
    this.cardTransform.set(
      `translateX(${direction * 1200}px) rotate(${direction * 45}deg)`,
    );
    this.cardOpacity.set(0);
    if (goRight) {
      this.rightCueOpacity.set(1);
    } else {
      this.leftCueOpacity.set(1);
    }

    setTimeout(() => {
      this.swipeInProgress = false;
      const isRating = this.poll()?.optionType === OptionType.Rating;
      this.castVote(isRating ? (goRight ? '5' : '1') : goRight ? '1' : '2');
    }, 500);
  }

  private resetCardState(): void {
    this.cardTransition.set('');
    this.cardTransform.set('');
    this.cardOpacity.set(1);
    this.leftCueOpacity.set(0);
    this.rightCueOpacity.set(0);
    this.currentDragX = 0;
    this.pendingRating.set(undefined);
  }

  private castVote(choice: string): void {
    this.hasVotedInSession.set(true);
    if (this.revoteMode()) {
      this.visitedInRevote.update((s) => new Set([...s, this.optionId()]));
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
          ['/polls/', this.projectId(), 'vote', this.pollId()!, next.id],
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
