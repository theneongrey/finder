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

@Component({
    selector: 'app-results-share-bar',
    templateUrl: './results-share-bar.component.html',
    imports: [DsButtonComponent, DsIconComponent, TranslatePipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsShareBarComponent {
    private readonly translateService = inject(TranslateService);

    shareLink = input.required<string>();
    dismiss = output<void>();

    copy(): void {
        navigator.clipboard.writeText(this.shareLink()).then(() => {
            toast.success(
                this.translateService.instant('project.share.linkCopied'),
            );
        });
    }
}
