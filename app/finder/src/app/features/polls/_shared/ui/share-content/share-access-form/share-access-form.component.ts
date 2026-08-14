import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
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
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(6px)' }),
        animate('240ms cubic-bezier(.22,.7,.3,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('180ms cubic-bezier(.4,0,1,1)', style({ opacity: 0, transform: 'translateY(-4px)' })),
      ]),
    ]),
  ],
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
