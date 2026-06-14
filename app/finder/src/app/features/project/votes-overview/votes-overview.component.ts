import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
} from '@angular/core';
import { ProjectStore } from '../_data/project.store';
import { TitleService } from '../../../common/services/title.service';
import { RoutingService } from '../../../common/services/routing.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { VoteOverviewSummaryComponent } from './vote-overview-summary/vote-overview-summary.component';
import { OptionListComponent } from './option-list/option-list.component';
import {
  CommentsSectionComponent,
  Comment,
} from './comments-section/comments-section.component';

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
  private readonly routingService = inject(RoutingService);
  private readonly translateService = inject(TranslateService);

  currentUrl = this.routingService.currentUrl();

  projectId = input('');
  topicId = input('');

  topic = this.projectStore.currentTopic;

  comments: Comment[] = [
    {
      author: 'Bob',
      initials: 'B',
      text: 'The color really matches our living room!',
      time: '2h ago',
    },
    {
      author: 'Mike',
      initials: 'M',
      text: 'Looks very comfortable.',
      time: '10min ago',
    },
    {
      author: 'Anna',
      initials: 'A',
      text: 'Might be too delicate for everyday use.',
      time: 'Yesterday',
    },
  ];

  constructor() {
    const titleService = inject(TitleService);
    const title = this.translateService.translate(
      'project.votesOverview.title',
    );

    effect(() => {
      this.projectStore.getProject(this.projectId());
    });

    effect(() => {
      this.projectStore.getTopic(this.topicId());
    });

    effect(() => {
      const topic = this.topic();
      if (topic) {
        titleService.setBackroute('/project/detail/' + this.projectId());
        titleService.setTitle(title());
      }
    });
  }
}
