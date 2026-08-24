import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { ResultsProgressBarComponent, ProgressSegment } from '../results-progress-bar/results-progress-bar.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { AvatarStackComponent, AvatarUser } from '@smart/avatar-stack/avatar-stack.component';
import { OptionDetail, SharedWith } from '../../../../_shared/models/poll-detail.model';

interface RatingGroup {
  label: string;
  bg: string;
  fg: string;
  names: string;
}

@Component({
  selector: 'app-option-card-rating',
  templateUrl: './option-card-rating.component.html',
  imports: [RouterLink, DsButtonComponent, ResultsProgressBarComponent, AvatarStackComponent, DsIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardRatingComponent {
  option = input.required<OptionDetail>();
  members = input<SharedWith[]>([]);
  isMostVoted = input(false);
  projectId = input('');
  pollId = input('');
  hideResults = input(false);
  rank = input(0);

  expanded = signal(false);

  readonly starsArray = [1, 2, 3, 4, 5];

  readonly averageRating = computed(() => {
    const rated = this.option().votes.filter(
      v => v.choice && !isNaN(parseInt(v.choice)) && parseInt(v.choice) > 0,
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
    this.option().votes.filter(v => v.choice && !isNaN(parseInt(v.choice)) && parseInt(v.choice) > 0).length,
  );

  readonly voteLine = computed(() => {
    const count = this.ratingsCount();
    const avg = this.averageRating();
    if (!count) { return 'Keine Bewertungen'; }
    return `${count} Bewertungen · Ø ${avg.toFixed(1).replace('.', ',')} von 5`;
  });

  readonly avatarUsers = computed((): AvatarUser[] => {
    const voted = this.votedNames();
    const members = this.members();
    if (members.length) {
      return members.map(m => ({ name: m.name, voted: voted.has(m.name) }));
    }
    return this.option().votes.map(v => ({ name: v.person, voted: true }));
  });

  private readonly votedNames = computed(() =>
    new Set(this.option().votes.map(v => v.person)),
  );

  readonly groups = computed((): RatingGroup[] => {
    const groups: RatingGroup[] = [];
    for (let stars = 5; stars >= 1; stars--) {
      const voters = this.option().votes.filter(
        v => parseInt(v.choice ?? '0') === stars,
      );
      if (!voters.length) { continue; }
      groups.push({ label: `${stars} ★`, bg: '#f9edd5', fg: '#a8742a', names: voters.map(v => v.person).join(', ') });
    }
    const open = this.members().filter(m => !this.votedNames().has(m.name));
    if (open.length) {
      groups.push({ label: 'Offen', bg: '#f1eee9', fg: '#8a8681', names: open.map(m => m.name).join(', ') });
    }
    return groups;
  });

}
