import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
} from '@angular/core';
import { PollDetailStore } from '../../_shared/data/poll-detail.store';
import { TranslatePipe } from '@ngx-translate/core';
import { VoteOverviewSummaryComponent } from '../results/vote-overview-summary/vote-overview-summary.component';
import { OptionListComponent } from '../results/option-list/option-list.component';
import { CommentsSectionComponent } from '../results/comments-section/comments-section.component';
import { TitleBarService } from '../../../../common/services/title-bar.service';

@Component({
  selector: 'app-poll-overview',
  templateUrl: './poll-overview.component.html',
  imports: [
    TranslatePipe,
    VoteOverviewSummaryComponent,
    OptionListComponent,
    CommentsSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollOverviewComponent {
  private readonly projectDetailStore = inject(PollDetailStore);

  pollId = input('');
  projectId = this.projectDetailStore.projectId;

  poll = this.projectDetailStore.currentPoll;
  project = this.projectDetailStore.currentProject;

  constructor() {
    const titleService = inject(TitleBarService);

    effect(() => {
      this.projectDetailStore.getPoll(this.pollId());
    });

    effect(() => {
      const project = this.project();
      if (project) {
        titleService.setTitle(project.name);
        titleService.setBackRoute('/polls');
      }
    });
  }

  addComment(content: string) {
    this.projectDetailStore.addComment({ pollId: this.pollId(), content });
  }
}
