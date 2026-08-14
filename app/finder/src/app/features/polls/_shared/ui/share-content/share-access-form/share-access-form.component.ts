import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { toast } from '@spartan-ng/brain/sonner';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import {
  DsSegmentedControlComponent,
  SegmentOption,
} from '@ds/segmented-control/ds-segmented-control.component';

@Component({
  selector: 'app-share-access-tab',
  imports: [DsButtonComponent, DsIconComponent, DsSegmentedControlComponent, TranslatePipe],
  templateUrl: './share-access-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .link-card-outer {
      overflow: hidden;
      max-height: 0;
      opacity: 0;
      transition: max-height 340ms cubic-bezier(.4,0,.2,1), opacity 220ms ease;
    }
    .link-card-outer--open {
      max-height: 250px;
      opacity: 1;
    }
  `],
})
export class ShareAccessFormComponent {
  private readonly translateService = inject(TranslateService);

  visibilityOptions = input.required<SegmentOption[]>();
  selectedVisibility = input.required<string>();
  isPublic = input.required<boolean>();
  shareLink = input.required<string>();

  visibilityChange = output<string>();

  copyLink() {
    navigator.clipboard.writeText(this.shareLink()).then(() => {
      toast.success(this.translateService.instant('project.share.linkCopied'));
    });
  }
}
