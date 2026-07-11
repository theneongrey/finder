import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProjectListStore } from '../_shared/data/project-list.store';
import { ProjectOverview } from '../_shared/models/project-overview.model';
import { TitleBarComponent } from '../../../common/ui/components/title-bar/title-bar.component';
import { TitleBarService } from '../../../common/services/title-bar.service';
import { MaxHeightMinusHeaderDirective } from '../../../common/ui/directives/max-height-minus-header.directive';
import { OverviewTabComponent } from './tabs/overview-tab/overview-tab.component';
import { ProjectsTabComponent } from './tabs/projects-tab/projects-tab.component';
import { StandalonePollTabComponent } from './tabs/standalone-poll-tab/standalone-poll-tab.component';
import { Tag } from 'primeng/tag';
import { PollItem } from '../_shared/models/poll-item.model';
import { ShareDrawerComponent } from '../../../common/ui/components/share-drawer/share-drawer.component';

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
    StandalonePollTabComponent,
    Tag,
    ShareDrawerComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './project-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tw:h-full tw:max-h-full',
  },
})
export class ProjectOverviewComponent {
  private readonly projectListStore = inject(ProjectListStore);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translateService = inject(TranslateService);
  private readonly titleBarService = inject(TitleBarService);

  projects = this.projectListStore.projects;
  standalonePolls = this.projectListStore.standalonePolls;
  activeTab = this.projectListStore.activeTab;
  sharingProjectId = signal<
    { type: 'poll' | 'project'; projectId: string } | undefined
  >(undefined);
  sharingProject = computed(() => this.getSharingProject());

  constructor() {
    this.projectListStore.getProjects();
    this.projectListStore.getStandalonePolls();
    this.titleBarService.clearTitle();
  }

  get activeTabValue() {
    return this.activeTab();
  }

  set activeTabValue(value: string) {
    this.projectListStore.setActiveTab(
      value as 'overview' | 'projects' | 'polls',
    );
  }

  shareRequested(projectId: string) {
    this.sharingProjectId.set({ type: 'project', projectId });
  }

  pollShareRequested(projectId: string) {
    this.sharingProjectId.set({ type: 'poll', projectId });
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
      accept: () => this.projectListStore.deleteProject(project.id),
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
      accept: () => this.projectListStore.deleteProject(poll.projectId),
    });
  }

  protected shareDrawerVisibilityChanged(value: boolean) {
    if (!value) {
      this.sharingProjectId.set(undefined);
    }
  }

  private getSharingProject() {
    const sharingProjectId = this.sharingProjectId();

    if (sharingProjectId?.type === 'project') {
      const project = this.projects().find(
        (p) => p.id === sharingProjectId.projectId,
      );

      return project
        ? {
            projectId: project.id,
            projectName: project.name,
            sharedWith: project.sharedWith,
            visibilityType: project.visibilityType,
          }
        : undefined;
    } else if (sharingProjectId?.type === 'poll') {
      const poll = this.standalonePolls().find(
        (p) => p.projectId === sharingProjectId.projectId,
      );

      return poll
        ? {
            projectId: poll.projectId,
            projectName: poll.name,
            sharedWith: poll.sharedWith,
            visibilityType: poll.visibilityType,
          }
        : undefined;
    }

    return undefined;
  }
}
