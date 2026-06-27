import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
} from '@angular/core';
import { ProjectStore } from '../_data/project.store';
import { TitleService } from '../../../common/services/title.service';
import { TranslatePipe } from '@ngx-translate/core';
import { VoteOverviewSummaryComponent } from './vote-overview-summary/vote-overview-summary.component';
import { OptionListComponent } from './option-list/option-list.component';
import { CommentsSectionComponent } from './comments-section/comments-section.component';

@Component({
  selector: 'app-votes-overview',
  templateUrl: './votes-overview.component.html',
  styleUrl: './votes-overview.component.css',
  imports: [
    TranslatePipe,
    VoteOverviewSummaryComponent,
    OptionListComponent,
    CommentsSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VotesOverviewComponent {
  private readonly projectStore = inject(ProjectStore);

  projectId = input('');
  topicId = input('');

  topic = this.projectStore.currentTopic;
  project = this.projectStore.currentProject;

  constructor() {
    const titleService = inject(TitleService);

    effect(() => {
      this.projectStore.getProject(this.projectId());
    });

    effect(() => {
      this.projectStore.getTopic(this.topicId());
    });

    effect(() => {
      const topic = this.topic();
      const project = this.project();
      if (topic && project) {
        titleService.setBackroute('/project/detail/' + this.projectId());
        titleService.setTitle(project.name);
      }
    });
  }

  addComment(content: string) {
    this.projectStore.addComment({ topicId: this.topicId(), content });
  }
}
