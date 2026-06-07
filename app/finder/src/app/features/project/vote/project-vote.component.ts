import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { ProjectStore } from '../_data/project.store';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { TitleService } from '../../../common/services/title.service';

@Component({
  selector: 'app-project-vote',
  templateUrl: './project-vote.component.html',
  styleUrl: './project-vote.component.css',
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:mouseup)': 'onDragEnd()',
    '(window:touchend)': 'onDragEnd()',
    '(window:mousemove)': 'onDragMove($event)',
    '(window:touchmove)': 'onDragMove($event)',
  },
})
export class ProjectVoteComponent implements OnInit, AfterViewInit {
  private readonly titleService = inject(TitleService);
  private readonly projectStore = inject(ProjectStore);
  private readonly router = inject(Router);

  voteCardRef = viewChild.required<ElementRef<HTMLElement>>('voteCard');

  id = input('');
  topicId = input('');
  action = input('');
  optionId = input('');
  project = this.projectStore.currentProject;
  topic = computed(() =>
    this.project()?.topics.find((t) => t.id === this.topicId()),
  );
  option = computed(() =>
    this.topic()?.options.find((o) => o.id === this.optionId()),
  );
  votedCount = computed(
    () => this.topic()?.options.filter((o) => o.choice).length ?? 0,
  );
  totalCount = computed(() => this.topic()?.options.length ?? 0);

  private startX = 0;
  private isDragging = false;
  private currentDragX = 0;
  private swipeInProgress = false;

  cardTransform = signal('');
  cardTransition = signal('');
  cardOpacity = signal(1);
  leftCueOpacity = signal(0);
  rightCueOpacity = signal(0);

  constructor() {
    this.titleService.setBackroute(`/project/detail/${this.project()?.id}`);
    effect(() => {
      this.projectStore.getProject(this.id());
    });
    effect(() => {
      this.optionId();
      this.resetCardState();
    });
  }

  ngOnInit(): void {
    if (!this.optionId()) {
      if (this.id() && this.topic()) {
        this.navigateToNextOption(undefined, true);
      } else {
        void this.router.navigate(['/project']);
      }
    }
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

    if (Math.abs(this.currentDragX) > 150) {
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

  skip(): void {
    this.navigateToNextOption(this.optionId());
  }

  navigateToOverview(): void {
    void this.router.navigate([
      '/project/detail/',
      this.id(),
      'votes-overview',
      this.topicId(),
    ]);
  }

  private animateAndVote(goRight: boolean): void {
    if (this.swipeInProgress) {
      return;
    }
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
      this.castVote(goRight ? '1' : '2');
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
    this.projectStore.vote({ optionId: this.optionId(), choice });
    this.navigateToNextOption(this.optionId());
  }

  private navigateToNextOption(
    ignore: string | undefined,
    replaceUrl = false,
  ): void {
    const options = this.topic()!.options;
    const nextOption = options.find((o) => !o.choice && o.id !== ignore);
    if (!nextOption) {
      void this.router.navigate(
        ['/project/detail/', this.id(), 'votes-overview', this.topicId()!],
        { replaceUrl },
      );
      return;
    }

    void this.router.navigate(
      ['/project/detail/', this.id(), 'vote', this.topicId()!, nextOption.id],
      { replaceUrl },
    );
  }
}
