import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

const RATING_LABELS: Record<number, string> = {
  1: 'Gar nicht',
  2: 'Eher nicht',
  3: 'Geht so',
  4: 'Gut',
  5: 'Perfekt',
};

@Component({
  selector: 'app-vote-card-rating',
  templateUrl: './vote-card-rating.component.html',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  protected readonly ratingLabel = computed(() => {
    const r = this.displayedRating();
    return r ? RATING_LABELS[r] : 'Tippe auf die Sterne';
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
