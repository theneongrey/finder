import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { OptionDetail, OptionType } from '../../../_models/project-detail.model';
import { OptionCardComponent } from './option-card/option-card.component';
import { OptionCardDateComponent } from './option-card-date/option-card-date.component';
import { OptionCardRatingComponent } from './option-card-rating/option-card-rating.component';

@Component({
  selector: 'app-option-list',
  templateUrl: './option-list.component.html',
  imports: [TranslatePipe, OptionCardComponent, OptionCardDateComponent, OptionCardRatingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionListComponent {
  readonly OptionType = OptionType;

  options = input.required<OptionDetail[]>();
  projectId = input('');
  topicId = input('');
  optionType = input(OptionType.YesNo);

  sortedOptions = computed(() =>
    [...this.options()].sort((a, b) =>
      this.optionType() === OptionType.Rating
        ? this.getAverageRating(b) - this.getAverageRating(a)
        : this.getYesVotes(b).length - this.getYesVotes(a).length,
    ),
  );

  getYesVotes(option: OptionDetail) {
    return option.votes.filter((vote) => vote.choice === '1');
  }

  getAverageRating(option: OptionDetail): number {
    const rated = option.votes.filter(
      (v) => v.choice && parseInt(v.choice) > 0,
    );
    if (!rated.length) return 0;
    return rated.reduce((sum, v) => sum + parseInt(v.choice!), 0) / rated.length;
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
