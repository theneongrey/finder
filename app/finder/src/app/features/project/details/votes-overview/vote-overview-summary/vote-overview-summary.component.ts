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
import { TopicDetail } from '../../../_models/project-detail.model';

@Component({
  selector: 'app-vote-overview-summary',
  templateUrl: './vote-overview-summary.component.html',
  imports: [RouterLink, ProgressBar, Button, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteOverviewSummaryComponent {
  topic = input.required<TopicDetail>();
  commentsCount = input(0);
  projectId = input('');
  topicId = input('');

  votedCount = computed(
    () => this.topic().options.filter((o) => o.choice).length,
  );

  totalCount = computed(() => this.topic().options.length);

  hasOpenOptions = computed(() => this.topic().options.some((o) => !o.choice));

  progressPercent = computed(() => {
    const total = this.totalCount();
    return total > 0 ? Math.round((this.votedCount() / total) * 100) : 0;
  });
}
