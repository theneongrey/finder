import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PollListStore } from '../_shared/data/poll-list.store';
import { TitleBarComponent } from '@smart/title-bar/title-bar.component';
import { TitleBarService } from '../../../common/services/title-bar.service';
import { StandalonePollTabComponent } from './standalone-poll-tab/standalone-poll-tab.component';
import { PollItem } from '../_shared/models/poll-item.model';
import { ShareDrawerComponent } from '@ds/share-drawer/share-drawer.component';
import { ShareContentComponent } from '../_shared/ui/share-content/share-content.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';

@Component({
  selector: 'app-polls-overview',
  imports: [
    RouterLink,
    TranslatePipe,
    TitleBarComponent,
    StandalonePollTabComponent,
    ShareDrawerComponent,
    ShareContentComponent,
    DsIconComponent,
    TranslatePipe,
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

  private readonly shareTitle = this.translateService.translate('project.share.title');
  private readonly sharePollLabel = this.translateService.translate('project.share.pollLabel');
  readonly shareDrawerTitle = this.shareTitle;
  readonly shareDrawerSubtitle = computed(
    () => `${this.sharePollLabel()} · ${this.sharingProject()?.projectName ?? ''}`,
  );

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
    this.projectListStore.deleteProject(poll.projectId);
  }

  protected shareDrawerVisibilityChanged(value: boolean) {
    if (!value) {
      this.sharingProjectId.set(undefined);
    }
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
