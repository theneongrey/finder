import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { OptionType, OptionDetail } from '../../../_shared/models/poll-detail.model';
import { DsCardComponent } from '../../../../../common/ui/ds-components/card/ds-card.component';
import { DsIconComponent } from '../../../../../common/ui/ds-components/icon/ds-icon.component';
import { VoteCardImageComponent } from '../vote-card-image/vote-card-image.component';
import { VoteCardTextComponent } from '../vote-card-text/vote-card-text.component';
import { VoteCardDateComponent } from '../vote-card-date/vote-card-date.component';

@Component({
  selector: 'app-vote-swipe-card',
  templateUrl: './vote-swipe-card.component.html',
  styleUrl: './vote-swipe-card.component.css',
  imports: [
    TranslatePipe,
    DsCardComponent,
    DsIconComponent,
    VoteCardImageComponent,
    VoteCardTextComponent,
    VoteCardDateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: contents',
    '(window:mouseup)': 'onDragEnd()',
    '(window:touchend)': 'onDragEnd()',
    '(window:mousemove)': 'onDragMove($event)',
    '(window:touchmove)': 'onDragMove($event)',
  },
})
export class VoteSwipeCardComponent implements AfterViewInit {
  readonly OptionType = OptionType;

  optionType = input(OptionType.YesNo);
  option = input<OptionDetail | undefined>(undefined);
  allOptionTexts = input<string[]>([]);

  voted = output<boolean>();

  voteCardRef = viewChild.required<ElementRef<HTMLElement>>('voteCard');

  cardTransform = signal('');
  cardTransition = signal('');
  cardOpacity = signal(1);
  leftCueOpacity = signal(0);
  rightCueOpacity = signal(0);
  showHint = signal(!sessionStorage.getItem('finder_voted_session'));
  hintFading = signal(false);

  private readonly SWIPE_THRESHOLD = 75;
  private startX = 0;
  private isDragging = false;
  private currentDragX = 0;
  private swipeInProgress = false;

  constructor() {
    effect(() => {
      this.option();
      this.resetCard();
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
    if (this.swipeInProgress) { return; }
    this.isDragging = true;
    this.startX =
      event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    this.cardTransition.set('none');
  }

  onDragMove(event: MouseEvent | TouchEvent): void {
    if (!this.isDragging) { return; }
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
    if (!this.isDragging) { return; }
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

  dismissHint(): void {
    if (!this.showHint() || this.hintFading()) return;
    sessionStorage.setItem('finder_voted_session', '1');
    this.hintFading.set(true);
    setTimeout(() => this.showHint.set(false), 300);
  }

  resetCard(): void {
    this.cardTransition.set('');
    this.cardTransform.set('');
    this.cardOpacity.set(0);
    this.leftCueOpacity.set(0);
    this.rightCueOpacity.set(0);
    this.currentDragX = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => this.cardOpacity.set(1)));
  }

  private animateAndVote(goRight: boolean): void {
    if (this.swipeInProgress) return;
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
      this.voted.emit(goRight);
    }, 500);
  }
}
