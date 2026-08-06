import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  HlmAvatar,
  HlmAvatarFallback,
  HlmAvatarGroup,
  HlmAvatarImage,
} from '@spartan-ng/helm/avatar';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { ShareDrawerComponent } from '../../../../common/ui/components/share-drawer/share-drawer.component';
import { ProjectRole } from '../../_shared/models/project-role.enum';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TitleBarService } from '../../../../common/services/title-bar.service';
import { ProjectDetailStore } from '../../_shared/data/project-detail.store';
import { AddCardComponent } from '../../../../common/ui/components/add-card/add-card.component';
import { PollItemComponent } from '../../_shared/ui/poll-item/poll-item.component';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-project-detail',
  imports: [
    ...HlmAlertDialogImports,
    AddCardComponent,
    ReactiveFormsModule,
    PollItemComponent,
    RouterLink,
    HlmAvatar,
    HlmAvatarFallback,
    HlmAvatarGroup,
    HlmAvatarImage,
    ...HlmTooltipImports,
    ShareDrawerComponent,
    TranslatePipe,
    HlmButton,
  ],
  templateUrl: './project-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailComponent {
  private readonly titleService = inject(TitleBarService);
  private readonly projectDetailStore = inject(ProjectDetailStore);
  private readonly translateService = inject(TranslateService);

  action = input('');
  project = this.projectDetailStore.currentProject;

  showShare = model(false);
  polls = computed(() => {
    const project = this.project();
    return (
      project?.polls.map((t) => ({
        ...t,
        pollId: t.id,
        projectId: project.id,
        role: project.role,
      })) ?? []
    );
  });
  role = computed(() => this.project()?.role ?? ProjectRole.Unknown);

  readonly ProjectRole = ProjectRole;

  confirmDialogOpen = signal(false);
  confirmTitle = signal('');
  confirmMessage = signal('');
  confirmAcceptLabel = signal('');
  private pendingConfirmAction: (() => void) | null = null;

  constructor() {
    effect(() => {
      const project = this.project();
      if (project) {
        this.titleService.setTitle(project.name);
      }
    });
  }

  showDeletePollDialog(id: string, title: string) {
    this.confirmTitle.set(
      this.translateService.instant('project.detail.deletePollConfirm.header'),
    );
    this.confirmMessage.set(
      this.translateService.instant('project.detail.deletePollConfirm.message', { name: title }),
    );
    this.confirmAcceptLabel.set(
      this.translateService.instant('project.detail.deletePollConfirm.accept'),
    );
    this.pendingConfirmAction = () => this.projectDetailStore.deletePoll(id);
    this.confirmDialogOpen.set(true);
  }

  onConfirmAccept() {
    this.pendingConfirmAction?.();
    this.confirmDialogOpen.set(false);
  }
}
