import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { VisibilityType } from '../../../../../../features/polls/_shared/models/poll-detail.model';

@Component({
  selector: 'app-share-access-form',
  imports: [...HlmToggleGroupImports, TranslatePipe],
  templateUrl: './share-access-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareAccessFormComponent {
  private readonly translateService = inject(TranslateService);

  visibilityOptions = input.required<{ label: string; value: VisibilityType }[]>();
  selectedVisibility = input.required<VisibilityType>();
  isPublic = input.required<boolean>();
  shareLink = input.required<string>();

  visibilityChange = output<VisibilityType>();

  onVisibilityChange(value: VisibilityType | VisibilityType[] | null | undefined) {
    if (typeof value === 'number') {
      this.visibilityChange.emit(value);
    }
  }

  copyLink() {
    navigator.clipboard.writeText(this.shareLink()).then(() => {
      toast.success(this.translateService.instant('project.share.linkCopied'));
    });
  }
}
