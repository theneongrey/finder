import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { SelectButton } from 'primeng/selectbutton';
import { Toast } from 'primeng/toast';
import { VisibilityType } from '../../../../../../features/project/_shared/models/project-detail.model';

@Component({
  selector: 'app-share-access-tab',
  imports: [SelectButton, Button, Toast, FormsModule, TranslatePipe],
  templateUrl: './share-access-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService],
})
export class ShareAccessFormComponent {
  private readonly translateService = inject(TranslateService);
  private readonly messageService = inject(MessageService);

  visibilityOptions =
    input.required<{ label: string; value: VisibilityType }[]>();
  selectedVisibility = input.required<VisibilityType>();
  isPublic = input.required<boolean>();
  shareLink = input.required<string>();

  visibilityChange = output<VisibilityType>();

  onVisibilityChange(value: VisibilityType) {
    this.visibilityChange.emit(value);
  }

  copyLink() {
    navigator.clipboard.writeText(this.shareLink()).then(() => {
      this.messageService.add({
        severity: 'success',
        detail: this.translateService.instant('project.share.linkCopied'),
        life: 3000,
      });
    });
  }
}
