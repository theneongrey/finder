import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

const RATING_LABEL_KEYS: Record<number, string> = {
  1: 'project.vote.ratingLabel.1',
  2: 'project.vote.ratingLabel.2',
  3: 'project.vote.ratingLabel.3',
  4: 'project.vote.ratingLabel.4',
  5: 'project.vote.ratingLabel.5',
};

@Component({
  selector: 'app-vote-card-rating',
  templateUrl: './vote-card-rating.component.html',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
})
export class VoteCardRatingComponent {
  text = input('');
  description = input('');
  currentRating = input<number | undefined>(undefined);

  rated = output<number>();

  hoveredStar = signal<number | undefined>(undefined);

  protected readonly displayedRating = computed(
    () => this.hoveredStar() ?? this.currentRating(),
  );

  protected readonly ratingLabelKey = computed(() => {
    const r = this.displayedRating();
    return r ? RATING_LABEL_KEYS[r] : 'project.vote.tapToRate';
  });

  protected readonly ratingLabelColor = computed(() =>
    this.displayedRating() ? 'var(--accent)' : 'var(--text-muted)',
  );

  protected readonly stars = [1, 2, 3, 4, 5];

  isStarFilled(star: number): boolean {
    const displayed = this.displayedRating();
    return displayed !== undefined && star <= displayed;
  }

  onStarClick(star: number): void {
    this.rated.emit(star);
  }
}
