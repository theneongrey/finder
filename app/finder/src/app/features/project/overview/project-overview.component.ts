import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProjectListStore } from '../_shared/data/project-list.store';
import { TitleBarComponent } from '../../../common/ui/components/title-bar/title-bar.component';
import { TitleBarService } from '../../../common/services/title-bar.service';
import { MaxHeightMinusHeaderDirective } from '../../../common/ui/directives/max-height-minus-header.directive';
import { StandalonePollTabComponent } from './tabs/standalone-poll-tab/standalone-poll-tab.component';
import { PollItem } from '../_shared/models/poll-item.model';
import { ShareDrawerComponent } from '../../../common/ui/components/share-drawer/share-drawer.component';

@Component({
  selector: 'app-project-overview',
  imports: [
    ...HlmAlertDialogImports,
    TranslatePipe,
    TitleBarComponent,
    MaxHeightMinusHeaderDirective,
    StandalonePollTabComponent,
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

  standalonePolls = this.projectListStore.standalonePolls;
  sharingProjectId = signal<string | undefined>(undefined);
  sharingProject = computed(() => this.getSharingProject());

  confirmDialogOpen = signal(false);
  confirmTitle = signal('');
  confirmMessage = signal('');
  confirmAcceptLabel = signal('');
  private pendingConfirmAction: (() => void) | null = null;

  constructor() {
    this.projectListStore.getStandalonePolls();
    this.titleBarService.clearTitle();
  }

  pollShareRequested(projectId: string) {
    this.sharingProjectId.set(projectId);
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
    const projectId = this.sharingProjectId();
    const poll = this.standalonePolls().find((p) => p.projectId === projectId);

    return poll
      ? {
          projectId: poll.projectId,
          projectName: poll.name,
          sharedWith: poll.sharedWith,
          visibilityType: poll.visibilityType,
        }
      : undefined;
  }
}
