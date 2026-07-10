import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'app-share-link-tab',
  templateUrl: './share-link-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, InputText, TranslatePipe, Toast],
  providers: [MessageService],
})
export class ShareLinkTabComponent {
  private readonly translateService = inject(TranslateService);
  private readonly messageService = inject(MessageService);

  shareLink = input.required<string>();
  isPublic = input.required<boolean>();

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
