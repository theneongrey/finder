import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import {
  OptionDetail,
  OptionType,
} from '../../../_shared/models/poll-detail.model';
import { OptionCardComponent } from './option-card/option-card.component';
import { OptionCardDateComponent } from './option-card-date/option-card-date.component';
import { OptionCardRatingComponent } from './option-card-rating/option-card-rating.component';

type SortMode = 'top' | 'original';

@Component({
  selector: 'app-option-list',
  templateUrl: './option-list.component.html',
  imports: [OptionCardComponent, OptionCardDateComponent, OptionCardRatingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionListComponent {
  readonly OptionType = OptionType;

  options = input.required<OptionDetail[]>();
  projectId = input('');
  pollId = input('');
  optionType = input(OptionType.YesNo);
  hideResults = input(false);

  sort = signal<SortMode>('top');

  sortedOptions = computed(() => {
    const opts = [...this.options()];
    if (this.hideResults() || this.sort() !== 'top') {
      return opts;
    }
    return opts.sort((a, b) =>
      this.optionType() === OptionType.Rating
        ? this.getAverageRating(b) - this.getAverageRating(a)
        : this.getYesVotes(b).length - this.getYesVotes(a).length,
    );
  });

  toggleSort() {
    this.sort.update(s => (s === 'top' ? 'original' : 'top'));
  }

  getYesVotes(option: OptionDetail) {
    return option.votes.filter((vote) => vote.choice === '1');
  }

  getAverageRating(option: OptionDetail): number {
    const rated = option.votes.filter(
      (v) => v.choice && parseInt(v.choice) > 0,
    );
    if (!rated.length) {
      return 0;
    }
    return (
      rated.reduce((sum, v) => sum + parseInt(v.choice!), 0) / rated.length
    );
  }

  hasMostVotes(option: OptionDetail) {
    if (this.optionType() === OptionType.Rating) {
      const avg = this.getAverageRating(option);
      return avg > 0 && avg === this.getAverageRating(this.sortedOptions()[0]);
    }
    const yesVoteCount = this.getYesVotes(option).length;
    return (
      yesVoteCount > 0 &&
      yesVoteCount == this.getYesVotes(this.sortedOptions()[0]).length
    );
  }
}
