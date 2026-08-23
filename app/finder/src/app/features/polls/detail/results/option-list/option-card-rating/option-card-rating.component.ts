import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsResultsProgressBarComponent, ProgressSegment } from '@ds/results-progress-bar/ds-results-progress-bar.component';
import { AvatarStackComponent, AvatarUser } from '@smart/avatar-stack/avatar-stack.component';
import { OptionDetail } from '../../../../_shared/models/poll-detail.model';

interface RatingGroup {
  stars: number;
  bg: string;
  fg: string;
  names: string;
}

@Component({
  selector: 'app-option-card-rating',
  templateUrl: './option-card-rating.component.html',
  imports: [RouterLink, DsButtonComponent, DsResultsProgressBarComponent, AvatarStackComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardRatingComponent {
  option = input.required<OptionDetail>();
  isMostVoted = input(false);
  projectId = input('');
  pollId = input('');
  hideResults = input(false);
  rank = input(0);

  expanded = signal(false);

  readonly starsArray = [1, 2, 3, 4, 5];

  readonly averageRating = computed(() => {
    const rated = this.option().votes.filter(
      v => v.choice && !isNaN(parseInt(v.choice)),
    );
    if (!rated.length) { return 0; }
    return rated.reduce((s, v) => s + parseInt(v.choice!), 0) / rated.length;
  });

  readonly progressPercent = computed(() =>
    Math.round((this.averageRating() / 5) * 100),
  );

  readonly segments = computed((): ProgressSegment[] => [
    { percent: this.progressPercent(), color: '#e0a42c' },
  ]);

  readonly avgLabel = computed(() => {
    const avg = this.averageRating();
    return avg > 0 ? avg.toFixed(1).replace('.', ',') : '—';
  });

  readonly ratingsCount = computed(() =>
    this.option().votes.filter(v => v.choice && !isNaN(parseInt(v.choice))).length,
  );

  readonly voteLine = computed(() => {
    const count = this.ratingsCount();
    const avg = this.averageRating();
    if (!count) { return 'Keine Bewertungen'; }
    return `${count} Bewertungen · Ø ${avg.toFixed(1).replace('.', ',')} von 5`;
  });

  readonly avatarUsers = computed((): AvatarUser[] => {
    const maxRating = Math.max(
      ...this.option().votes.map(v => parseInt(v.choice ?? '0')),
      0,
    );
    if (!maxRating) { return []; }
    return this.option().votes
      .filter(v => parseInt(v.choice ?? '0') === maxRating)
      .map(v => ({ name: v.person }));
  });

  readonly groups = computed((): RatingGroup[] => {
    const groups: RatingGroup[] = [];
    for (let stars = 5; stars >= 1; stars--) {
      const voters = this.option().votes.filter(
        v => parseInt(v.choice ?? '0') === stars,
      );
      if (!voters.length) { continue; }
      groups.push({
        stars,
        bg: '#f9edd5',
        fg: '#a8742a',
        names: voters.map(v => v.person).join(', '),
      });
    }
    return groups;
  });

  isStarFilled(star: number): boolean {
    return star <= Math.round(this.averageRating());
  }
}
