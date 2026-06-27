import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ProjectStore } from '../../../_data/project.store';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-share-dialog',
  imports: [Dialog, Button, InputText, Select, FormsModule, TranslatePipe],
  templateUrl: './share-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareDialogComponent {
  private readonly projectStore = inject(ProjectStore);
  private readonly translateService = inject(TranslateService);

  projectId = input.required<string>();
  visible = model(false);

  private voterLabel = this.translateService.translate('project.roles.voter');
  private maintainerLabel = this.translateService.translate('project.roles.maintainer');
  private ownerLabel = this.translateService.translate('project.roles.owner');

  availablePermissions = computed(() => [
    { id: 0, name: this.voterLabel() },
    { id: 1, name: this.maintainerLabel() },
    { id: 2, name: this.ownerLabel() },
  ]);

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
