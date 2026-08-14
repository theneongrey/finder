import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PollListStore } from '../_shared/data/poll-list.store';
import { TitleBarComponent } from '@smart/title-bar/title-bar.component';
import { TitleBarService } from '../../../common/services/title-bar.service';
import { StandalonePollTabComponent } from './standalone-poll-tab/standalone-poll-tab.component';
import { PollItem } from '../_shared/models/poll-item.model';
import { ShareDrawerComponent } from '@ds/share-drawer/share-drawer.component';

@Component({
  selector: 'app-polls-overview',
  imports: [
    ...HlmAlertDialogImports,
    TranslatePipe,
    TitleBarComponent,
    StandalonePollTabComponent,
    ShareDrawerComponent,
  ],
  templateUrl: './polls-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'h-full max-h-full',
  },
})
export class PollsOverviewComponent {
  private readonly projectListStore = inject(PollListStore);
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
    this.translateService
      .stream('project.pollsTab.title')
      .pipe(takeUntilDestroyed())
      .subscribe((title: string) => {
        this.titleBarService.setTitle(title);
      });
  }

  pollShareRequested(projectId: string) {
    this.sharingProjectId.set(projectId);
  }

  pollDeletionRequested(poll: PollItem) {
    this.showConfirmDialog(
      this.translateService.instant(
        'project.overview.deletePollConfirm.header',
      ),
      this.translateService.instant(
        'project.overview.deletePollConfirm.message',
        { name: poll.name },
      ),
      this.translateService.instant(
        'project.overview.deletePollConfirm.accept',
      ),
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
