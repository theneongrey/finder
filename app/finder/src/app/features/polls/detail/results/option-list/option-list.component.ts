import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import {
  OptionDetail,
  SharedWith,
} from '../../../_shared/models/poll-detail.model';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { OptionCardComponent } from './option-card/option-card.component';
import { OptionCardDateComponent } from './option-card-date/option-card-date.component';
import { OptionType } from '@common/models/option-type.model';

type SortMode = 'top' | 'original';

@Component({
  selector: 'app-option-list',
  templateUrl: './option-list.component.html',
  imports: [
    RouterLink,
    DsButtonComponent,
    DsIconComponent,
    OptionCardComponent,
    OptionCardDateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionListComponent {
  readonly OptionType = OptionType;

  options = input.required<OptionDetail[]>();
  members = input<SharedWith[]>([]);
  projectId = input('');
  pollId = input('');
  optionType = input(OptionType.YesNo);
  hideResults = input(false);
  isClosed = input(false);

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
    this.sort.update((s) => (s === 'top' ? 'original' : 'top'));
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

  private readonly topScore = computed(() => {
    const opts = this.options();
    if (this.optionType() === OptionType.Rating) {
      return Math.max(0, ...opts.map((o) => this.getAverageRating(o)));
    }
    return Math.max(0, ...opts.map((o) => this.getYesVotes(o).length));
  });

  hasMostVotes(option: OptionDetail): boolean {
    const top = this.topScore();
    if (!top) {
      return false;
    }
    if (this.optionType() === OptionType.Rating) {
      return this.getAverageRating(option) === top;
    }
    return this.getYesVotes(option).length === top;
  }
}
