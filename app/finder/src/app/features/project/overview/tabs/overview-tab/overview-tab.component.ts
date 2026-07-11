import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { ProjectListStore } from '../../../_shared/data/project-list.store';
import { UserStore } from '../../../../../common/data/user.store';
import { ProjectItemComponent } from '../../project-item/project-item.component';
import { ProjectOverview } from '../../../_shared/models/project-overview.model';
import { computed } from '@angular/core';
import { OptionType } from '../../../_shared/models/project-detail.model';
import { PollItemComponent } from '../../../_shared/ui/poll-item/poll-item.component';
import { PollItem } from '../../../_shared/models/poll-item.model';

@Component({
  selector: 'app-overview-tab',
  imports: [TranslatePipe, Button, ProjectItemComponent, PollItemComponent],
  templateUrl: './overview-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewTabComponent {
  private readonly projectListStore = inject(ProjectListStore);
  private readonly userStore = inject(UserStore);

  projectDeletionRequested = output<ProjectOverview>();
  pollDeletionRequested = output<PollItem>();
  shareRequested = output<string>();
  pollShareRequested = output<string>();

  user = this.userStore.user;
  recentProjects = computed(() => this.projectListStore.projects().slice(0, 2));
  recentPolls = computed(() =>
    this.projectListStore
      .standalonePolls()
      .slice(0, 3)
      .map((t) => ({
        ...t,
        optionType: t.optionType as OptionType,
      })),
  );

  switchToProjects() {
    this.projectListStore.setActiveTab('projects');
  }

  switchToPolls() {
    this.projectListStore.setActiveTab('polls');
  }
}
