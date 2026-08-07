import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
} from '@angular/core';
import { PollDetailStore } from '../../_shared/data/poll-detail.store';
import { TranslatePipe } from '@ngx-translate/core';
import { VoteOverviewSummaryComponent } from './vote-overview-summary/vote-overview-summary.component';
import { OptionListComponent } from './option-list/option-list.component';
import { CommentsSectionComponent } from './comments-section/comments-section.component';
import { TitleBarService } from '../../../../common/services/title-bar.service';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  imports: [
    TranslatePipe,
    VoteOverviewSummaryComponent,
    OptionListComponent,
    CommentsSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsComponent {
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
      }
    });
  }

  addComment(content: string) {
    this.projectDetailStore.addComment({ pollId: this.pollId(), content });
  }
}
