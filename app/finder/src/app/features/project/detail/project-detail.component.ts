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
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { TitleService } from '../../../common/services/title.service';
import { ProjectDetailItemComponent } from './project-detail-item/project-detail-item.component';
import { AddCardComponent } from '../../../common/ui/components/add-card/add-card.component';
import { RouterLink } from '@angular/router';
import { Avatar } from 'primeng/avatar';
import { AvatarGroup } from 'primeng/avatargroup';
import { Tooltip } from 'primeng/tooltip';

@Component({
  selector: 'app-project-detail',
  imports: [
    ConfirmDialog,
    Button,
    AddCardComponent,
    Dialog,
    InputText,
    ReactiveFormsModule,
    Select,
    FormsModule,
    ProjectDetailItemComponent,
    RouterLink,
    Avatar,
    AvatarGroup,
    Tooltip,
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

  availablePermissions = [
    {
      id: 0,
      name: 'Voter',
    },
    {
      id: 1,
      name: 'Maintainer',
    },
    {
      id: 2,
      name: 'Owner',
    },
  ];

  showAddTopicDialog = model(false);
  showShare = model(false);
  topic = model('');
  email = model('');
  selectedPermission = model(0);
  topics = computed(() => this.project()?.topics);

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
        this.deleteTopic(id);
      },
    });
  }

  deleteTopic(id: string) {
    this.projectStore.deleteTopic(id);
  }

  share() {
    if (this.email()) {
      this.projectStore.share({
        email: this.email(),
        permissionType: this.selectedPermission(),
        projectId: this.project()!.id,
      });
      this.showShare.set(false);
    }
  }
}
