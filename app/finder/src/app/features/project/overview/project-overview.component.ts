import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProjectStore } from '../_data/project.store';
import { ProjectOverview } from '../_models/project-overview.model';
import { PollItem } from '../topic-item/topic-item.model';
import { TitleBarComponent } from '../../../common/ui/components/title-bar/title-bar.component';
import { TitleBarService } from '../../../common/services/title-bar.service';
import { MaxHeightMinusHeaderDirective } from '../../../common/ui/directives/max-height-minus-header.directive';
import { OverviewTabComponent } from './tabs/overview-tab/overview-tab.component';
import { ProjectsTabComponent } from './tabs/projects-tab/projects-tab.component';
import { TopicsTabComponent } from './tabs/topics-tab/topics-tab.component';
import { Tag } from 'primeng/tag';

@Component({
  selector: 'app-project-overview',
  imports: [
    ConfirmDialog,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    TranslatePipe,
    TitleBarComponent,
    MaxHeightMinusHeaderDirective,
    OverviewTabComponent,
    ProjectsTabComponent,
    TopicsTabComponent,
    Tag,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './project-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tw:h-full tw:max-h-full',
  },
})
export class ProjectOverviewComponent {
  private readonly projectStore = inject(ProjectStore);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translateService = inject(TranslateService);
  private readonly titleBarService = inject(TitleBarService);

  projects = this.projectStore.projects;
  standalonePolls = this.projectStore.standalonePolls;
  activeTab = this.projectStore.activeTab;

  constructor() {
    this.projectStore.getProjects();
    this.projectStore.getStandalonePolls();
    this.titleBarService.clearTitle();
  }

  get activeTabValue() {
    return this.activeTab();
  }

  set activeTabValue(value: string) {
    this.projectStore.setActiveTab(value as 'overview' | 'projects' | 'polls');
  }

  projectDeletionRequested(project: ProjectOverview) {
    this.confirmationService.confirm({
      header: this.translateService.instant(
        'project.overview.deleteConfirm.header',
      ),
      message: this.translateService.instant(
        'project.overview.deleteConfirm.message',
        { name: project.name },
      ),
      acceptLabel: this.translateService.instant(
        'project.overview.deleteConfirm.accept',
      ),
      rejectLabel: this.translateService.instant('project.common.cancel'),
      accept: () => this.projectStore.deleteProject(project.id),
    });
  }

  pollDeletionRequested(poll: PollItem) {
    this.confirmationService.confirm({
      header: this.translateService.instant(
        'project.overview.deletePollConfirm.header',
      ),
      message: this.translateService.instant(
        'project.overview.deletePollConfirm.message',
        { name: poll.name },
      ),
      acceptLabel: this.translateService.instant(
        'project.overview.deletePollConfirm.accept',
      ),
      rejectLabel: this.translateService.instant('project.common.cancel'),
      accept: () => this.projectStore.deleteProject(poll.projectId),
    });
  }
}
