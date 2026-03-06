import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  model,
} from '@angular/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { ProjectStore } from '../../_data/project.store';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataView } from 'primeng/dataview';
import { Select } from 'primeng/select';
import { ProjectRoleToNamePipe } from '../../_utils/pipe/permission-to-name.pipe';

@Component({
  selector: 'app-project-detail-title-bar',
  imports: [
    Button,
    Dialog,
    InputText,
    FormsModule,
    RouterLink,
    DataView,
    Select,
    ProjectRoleToNamePipe,
  ],
  templateUrl: './project-detail-title-bar.component.html',
  styleUrl: './project-detail-title-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailTitleBarComponent {
  private projectStore = inject(ProjectStore);

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

  project = this.projectStore.currentProject;
  action = input<string | undefined>(undefined);

  showAddTopicDialog = model(false);
  showShareOverviewDialog = model(false);
  showShare = model(false);
  topic = model('');
  email = model('');
  selectedPermission = model(0);

  constructor() {
    effect(() => {
      if (this.project() && this.action() == 'add') {
        this.showAddTopicDialog.set(true);
      }
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
