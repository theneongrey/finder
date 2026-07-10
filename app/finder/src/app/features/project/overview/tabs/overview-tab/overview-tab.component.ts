import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { ProjectStore } from '../../../_shared/data/project.store';
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
  private readonly projectStore = inject(ProjectStore);
  private readonly userStore = inject(UserStore);

  projectDeletionRequested = output<ProjectOverview>();
  pollDeletionRequested = output<PollItem>();
  shareRequested = output<string>();

  user = this.userStore.user;
  recentProjects = computed(() => this.projectStore.projects().slice(0, 2));
  recentPolls = computed(() =>
    this.projectStore
      .standalonePolls()
      .slice(0, 3)
      .map((t) => ({
        ...t,
        optionType: t.optionType as OptionType,
      })),
  );

  switchToProjects() {
    this.projectStore.setActiveTab('projects');
  }

  switchToPolls() {
    this.projectStore.setActiveTab('polls');
  }
}
