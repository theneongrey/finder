import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProgressBar } from 'primeng/progressbar';
import { Button } from 'primeng/button';
import { TranslatePipe } from '@ngx-translate/core';
import { PollDetail } from '../../../_shared/models/project-detail.model';

@Component({
  selector: 'app-vote-overview-summary',
  templateUrl: './vote-overview-summary.component.html',
  imports: [RouterLink, ProgressBar, Button, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteOverviewSummaryComponent {
  poll = input.required<PollDetail>();
  commentsCount = input(0);
  projectId = input('');
  pollId = input('');

  votedCount = computed(
    () => this.poll().options.filter((o) => o.choice).length,
  );

  totalCount = computed(() => this.poll().options.length);

  hasOpenOptions = computed(() => this.poll().options.some((o) => !o.choice));

  progressPercent = computed(() => {
    const total = this.totalCount();
    return total > 0 ? Math.round((this.votedCount() / total) * 100) : 0;
  });
}
