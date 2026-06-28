import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { ProjectStore } from '../../../_data/project.store';
import { UserStore } from '../../../../../common/data/user.store';
import { ProjectItemComponent } from '../../project-item/project-item.component';
import { TopicItemComponent } from '../../../topic-item/topic-item.component';
import { TopicItem } from '../../../topic-item/topic-item.model';
import { ProjectOverview } from '../../../_models/project-overview.model';
import { computed } from '@angular/core';
import { OptionType } from '../../../_models/project-detail.model';

@Component({
  selector: 'app-overview-tab',
  imports: [TranslatePipe, Button, ProjectItemComponent, TopicItemComponent],
  templateUrl: './overview-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewTabComponent {
  private readonly projectStore = inject(ProjectStore);
  private readonly userStore = inject(UserStore);

  projectDeletionRequested = output<ProjectOverview>();
  topicDeletionRequested = output<TopicItem>();

  user = this.userStore.user;
  recentProjects = computed(() => this.projectStore.projects().slice(0, 2));
  recentTopics = computed(() =>
    this.projectStore
      .standaloneTopics()
      .slice(0, 3)
      .map((t) => ({
        ...t,
        optionType: t.optionType as OptionType,
      })),
  );

  switchToProjects() {
    this.projectStore.setActiveTab('projects');
  }

  switchToTopics() {
    this.projectStore.setActiveTab('topics');
  }
}
