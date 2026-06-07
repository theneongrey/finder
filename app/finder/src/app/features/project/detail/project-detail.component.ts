import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
} from '@angular/core';
import { ProjectStore } from '../_data/project.store';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { ReactiveFormsModule } from '@angular/forms';
import { TitleService } from '../../../common/services/title.service';
import { ProjectDetailItemComponent } from './project-detail-item/project-detail-item.component';
import { AddCardComponent } from '../../../common/ui/components/add-card/add-card.component';
import { RouterLink } from '@angular/router';
import { Avatar } from 'primeng/avatar';
import { AvatarGroup } from 'primeng/avatargroup';
import { Tooltip } from 'primeng/tooltip';
import { ShareDialogComponent } from './share-dialog/share-dialog.component';
import { ProjectRole } from '../_models/project-role.enum';

@Component({
  selector: 'app-project-detail',
  imports: [
    ConfirmDialog,
    Button,
    AddCardComponent,
    ReactiveFormsModule,
    ProjectDetailItemComponent,
    RouterLink,
    Avatar,
    AvatarGroup,
    Tooltip,
    ShareDialogComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailComponent {
  private readonly titleService = inject(TitleService);
  private readonly projectStore = inject(ProjectStore);
  private readonly confirmationService = inject(ConfirmationService);

  id = input('');
  action = input('');
  project = this.projectStore.currentProject;

  showShare = model(false);
  topics = computed(() => this.project()?.topics);
  role = computed(() => this.project()?.role ?? ProjectRole.Unknown);

  readonly ProjectRole = ProjectRole;

  constructor() {
    this.titleService.setBackroute('/project/');

    effect(() => {
      this.projectStore.getProject(this.id());
    });

    effect(() => {
      const project = this.project();
      if (project) {
        this.titleService.setTitle(project.name);
      }
    });
  }

  showDeleteTopicDialog(id: string, title: string) {
    this.confirmationService.confirm({
      header: 'Delete topic?',
      message: `Are you sure that you want to delete topic "${title}?"`,
      acceptLabel: 'Delete topic',
      rejectLabel: 'Cancel',
      accept: () => {
        this.projectStore.deleteTopic(id);
      },
    });
  }
}
