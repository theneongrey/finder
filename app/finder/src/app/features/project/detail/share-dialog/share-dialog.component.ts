import { ChangeDetectionStrategy, Component, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ProjectStore } from '../../_data/project.store';

@Component({
  selector: 'app-share-dialog',
  imports: [Dialog, Button, InputText, Select, FormsModule],
  templateUrl: './share-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareDialogComponent {
  private readonly projectStore = inject(ProjectStore);

  projectId = input.required<string>();
  visible = model(false);

  availablePermissions = [
    { id: 0, name: 'Voter' },
    { id: 1, name: 'Maintainer' },
    { id: 2, name: 'Owner' },
  ];

  email = model('');
  selectedPermission = model(0);

  share() {
    if (this.email()) {
      this.projectStore.share({
        email: this.email(),
        permissionType: this.selectedPermission(),
        projectId: this.projectId(),
      });
      this.visible.set(false);
    }
  }
}
