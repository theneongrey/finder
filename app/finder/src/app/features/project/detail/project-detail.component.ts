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
import { DataView } from 'primeng/dataview';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { ProjectRoleToNamePipe } from '../_utils/pipe/permission-to-name.pipe';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { TitleService } from '../../../common/services/title.service';
import { ProjectDetailItemComponent } from './project-detail-item/project-detail-item.component';

@Component({
  selector: 'app-project-detail',
  imports: [
    ConfirmDialog,
    Button,
    DataView,
    Dialog,
    InputText,
    ProjectRoleToNamePipe,
    ReactiveFormsModule,
    Select,
    FormsModule,
    ProjectDetailItemComponent,
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
  showShareOverviewDialog = model(false);
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
      if (this.project() && this.action() == 'add') {
        this.showAddTopicDialog.set(true);
      }
    });

    this.projectStore.getProjects();
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

  deleteProject(id: string) {
    this.projectStore.deleteProject(id);
  }

  showDeleteProjectDialog(event: MouseEvent, id: string, title: string) {
    event.stopPropagation();
    this.confirmationService.confirm({
      header: 'Delete?',
      message: `Are you sure that you want to delete project "${title}?"`,
      accept: () => {
        this.deleteProject(id);
      },
    });
  }

  addTopic() {
    if (this.topic()) {
      this.projectStore.addTopic({
        projectId: this.project()!.id,
        name: this.topic(),
      });
      this.showAddTopicDialog.set(false);
    }
  }

  displayAddTopicDialog() {
    this.topic.set('');
    this.showAddTopicDialog.set(true);
  }

  displayShareDialog() {
    if (this.project()!.sharedWith.length > 0) {
      this.showShareOverviewDialog.set(true);
    } else {
      this.showAdditionalShareDialog();
    }
  }

  showAdditionalShareDialog() {
    this.showShareOverviewDialog.set(false);
    this.showShare.set(true);
  }

  share() {
    if (this.email()) {
      this.projectStore.share({
        email: this.email(),
        permissionType: this.selectedPermission(),
        projectId: this.project()!.id,
      });
    }
  }
}
