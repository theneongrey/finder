import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
} from '@angular/core';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { ReactiveFormsModule } from '@angular/forms';
import { PollItemComponent } from '../../topic-item/topic-item.component';
import { RouterLink } from '@angular/router';
import { Avatar } from 'primeng/avatar';
import { AvatarGroup } from 'primeng/avatargroup';
import { Tooltip } from 'primeng/tooltip';
import { ShareDialogComponent } from './share-dialog/share-dialog.component';
import { ProjectRole } from '../../_models/project-role.enum';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TitleBarService } from '../../../../common/services/title-bar.service';
import { ProjectStore } from '../../_data/project.store';
import { AddCardComponent } from '../../../../common/ui/components/add-card/add-card.component';

@Component({
  selector: 'app-project-detail',
  imports: [
    ConfirmDialog,
    Button,
    AddCardComponent,
    ReactiveFormsModule,
    PollItemComponent,
    RouterLink,
    Avatar,
    AvatarGroup,
    Tooltip,
    ShareDialogComponent,
    TranslatePipe,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './project-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailComponent {
  private readonly titleService = inject(TitleBarService);
  private readonly projectStore = inject(ProjectStore);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translateService = inject(TranslateService);

  action = input('');
  project = this.projectStore.currentProject;

  showShare = model(false);
  polls = computed(() => {
    const project = this.project();
    return (
      project?.polls.map((t) => ({
        ...t,
        pollId: t.id,
        projectId: project.id,
      })) ?? []
    );
  });
  role = computed(() => this.project()?.role ?? ProjectRole.Unknown);

  readonly ProjectRole = ProjectRole;

  constructor() {
    effect(() => {
      const project = this.project();
      if (project) {
        this.titleService.setTitle(project.name);
      }
    });
  }

  showDeletePollDialog(id: string, title: string) {
    this.confirmationService.confirm({
      header: this.translateService.instant(
        'project.detail.deletePollConfirm.header',
      ),
      message: this.translateService.instant(
        'project.detail.deletePollConfirm.message',
        {
          name: title,
        },
      ),
      acceptLabel: this.translateService.instant(
        'project.detail.deletePollConfirm.accept',
      ),
      rejectLabel: this.translateService.instant('project.common.cancel'),
      accept: () => {
        this.projectStore.deletePoll(id);
      },
    });
  }
}
