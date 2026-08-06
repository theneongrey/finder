import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProjectListStore } from '../_shared/data/project-list.store';
import { ProjectOverview } from '../_shared/models/project-overview.model';
import { TitleBarComponent } from '../../../common/ui/components/title-bar/title-bar.component';
import { TitleBarService } from '../../../common/services/title-bar.service';
import { MaxHeightMinusHeaderDirective } from '../../../common/ui/directives/max-height-minus-header.directive';
import { OverviewTabComponent } from './tabs/overview-tab/overview-tab.component';
import { ProjectsTabComponent } from './tabs/projects-tab/projects-tab.component';
import { StandalonePollTabComponent } from './tabs/standalone-poll-tab/standalone-poll-tab.component';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { PollItem } from '../_shared/models/poll-item.model';
import { ShareDrawerComponent } from '../../../common/ui/components/share-drawer/share-drawer.component';

@Component({
  selector: 'app-project-overview',
  imports: [
    ...HlmTabsImports,
    ...HlmAlertDialogImports,
    TranslatePipe,
    TitleBarComponent,
    MaxHeightMinusHeaderDirective,
    OverviewTabComponent,
    ProjectsTabComponent,
    StandalonePollTabComponent,
    HlmBadge,
    ShareDrawerComponent,
  ],
  templateUrl: './project-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'h-full max-h-full',
  },
})
export class ProjectOverviewComponent {
  private readonly projectListStore = inject(ProjectListStore);
  private readonly translateService = inject(TranslateService);
  private readonly titleBarService = inject(TitleBarService);

  projects = this.projectListStore.projects;
  standalonePolls = this.projectListStore.standalonePolls;
  activeTab = this.projectListStore.activeTab;
  sharingProjectId = signal<
    { type: 'poll' | 'project'; projectId: string } | undefined
  >(undefined);
  sharingProject = computed(() => this.getSharingProject());

  confirmDialogOpen = signal(false);
  confirmTitle = signal('');
  confirmMessage = signal('');
  confirmAcceptLabel = signal('');
  private pendingConfirmAction: (() => void) | null = null;

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
    this.showConfirmDialog(
      this.translateService.instant('project.overview.deleteConfirm.header'),
      this.translateService.instant('project.overview.deleteConfirm.message', { name: project.name }),
      this.translateService.instant('project.overview.deleteConfirm.accept'),
      () => this.projectListStore.deleteProject(project.id),
    );
  }

  pollDeletionRequested(poll: PollItem) {
    this.showConfirmDialog(
      this.translateService.instant('project.overview.deletePollConfirm.header'),
      this.translateService.instant('project.overview.deletePollConfirm.message', { name: poll.name }),
      this.translateService.instant('project.overview.deletePollConfirm.accept'),
      () => this.projectListStore.deleteProject(poll.projectId),
    );
  }

  onConfirmAccept() {
    this.pendingConfirmAction?.();
    this.confirmDialogOpen.set(false);
  }

  protected shareDrawerVisibilityChanged(value: boolean) {
    if (!value) {
      this.sharingProjectId.set(undefined);
    }
  }

  private showConfirmDialog(
    title: string,
    message: string,
    acceptLabel: string,
    action: () => void,
  ) {
    this.confirmTitle.set(title);
    this.confirmMessage.set(message);
    this.confirmAcceptLabel.set(acceptLabel);
    this.pendingConfirmAction = action;
    this.confirmDialogOpen.set(true);
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
