import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { OptionDetail } from '../../../_models/project-detail.model';
import { OptionCardComponent } from './option-card/option-card.component';

@Component({
  selector: 'app-option-list',
  templateUrl: './option-list.component.html',
  imports: [TranslatePipe, OptionCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionListComponent {
  options = input.required<OptionDetail[]>();
  projectId = input('');
  topicId = input('');

  sortedOptions = computed(() =>
    [...this.options()].sort(
      (a, b) => this.getYesVotes(b).length - this.getYesVotes(a).length,
    ),
  );

  getYesVotes(option: OptionDetail) {
    return option.votes.filter((vote) => vote.choice === '1');
  }

  hasMostVotes(option: OptionDetail) {
    const yesVoteCount = this.getYesVotes(option).length;

    return (
      yesVoteCount > 0 &&
      yesVoteCount == this.getYesVotes(this.sortedOptions()[0]).length
    );
  }
}
