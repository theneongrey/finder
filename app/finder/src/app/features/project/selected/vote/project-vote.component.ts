import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { ProjectDetailStore } from '../../_shared/data/project-detail.store';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { TranslatePipe } from '@ngx-translate/core';
import { VoteCardImageComponent } from './vote-card-image/vote-card-image.component';
import { VoteCardTextComponent } from './vote-card-text/vote-card-text.component';
import { VoteCardDateComponent } from './vote-card-date/vote-card-date.component';
import { VoteCardRatingComponent } from './vote-card-rating/vote-card-rating.component';
import { VoteCommentButtonComponent } from './vote-comment-button/vote-comment-button.component';
import { TitleBarService } from '../../../../common/services/title-bar.service';
import { OptionType } from '../../_shared/models/project-detail.model';

@Component({
  selector: 'app-project-vote',
  templateUrl: './project-vote.component.html',
  styleUrl: './project-vote.component.css',
  imports: [
    Button,
    TranslatePipe,
    VoteCardImageComponent,
    VoteCardTextComponent,
    VoteCardDateComponent,
    VoteCommentButtonComponent,
    VoteCardRatingComponent,
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
  private readonly projectDetailStore = inject(ProjectDetailStore);
  private readonly router = inject(Router);

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

  private readonly localSkipCounts = signal(new Map<string, number>());
  private readonly hasVotedInSession = signal(false);

  constructor() {
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

  skip(): void {
    const optionId = this.optionId();
    const currentChoice = parseInt(this.option()?.choice ?? '0') || 0;
    const skipValue = Math.min(currentChoice, 0) - 1;
    this.projectDetailStore.vote({ optionId, choice: skipValue.toString() });

    const counts = new Map(this.localSkipCounts());
    counts.set(optionId, (counts.get(optionId) ?? 0) + 1);
    this.localSkipCounts.set(counts);

    this.navigateToNextOption(optionId);
  }

  navigateToOverview(): void {
    void this.router.navigate([
      '/project/detail/',
      this.projectId(),
      'votes-overview',
      this.pollId(),
    ]);
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
  }

  private castVote(choice: string): void {
    this.hasVotedInSession.set(true);
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
  private navigateToNextOption(
    ignore: string | undefined,
    replaceUrl = false,
  ): void {
    const options = this.poll()!.options;

    const nextUnvoted = options.find((o) => !o.choice && o.id !== ignore);
    if (nextUnvoted) {
      void this.router.navigate(
        [
          '/project/detail/',
          this.projectId(),
          'vote',
          this.pollId()!,
          nextUnvoted.id,
        ],
        { replaceUrl },
      );
      return;
    }

    if (this.hasVotedInSession()) {
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
            '/project/detail/',
            this.projectId(),
            'vote',
            this.pollId()!,
            nextSkipped.id,
          ],
          { replaceUrl },
        );
        return;
      }
    }

    void this.router.navigate(
      ['/project/detail/', this.projectId(), 'votes-overview', this.pollId()!],
      { replaceUrl },
    );
  }
}
