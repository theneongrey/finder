import {
    ChangeDetectionStrategy,
    Component,
    input,
    output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { DsBadgeComponent } from '@ds/badge/ds-badge.component';
import { DsStatusDotComponent } from '@ds/badge/ds-status-dot.component';

@Component({
    selector: 'app-poll-header',
    templateUrl: './poll-header.component.html',
    imports: [
        TranslatePipe,
        DsButtonComponent,
        DsIconComponent,
        DsBadgeComponent,
        DsStatusDotComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollHeaderComponent {
    name = input.required<string>();
    description = input<string | undefined>(undefined);
    isClosed = input(false);
    typeLabel = input('');
    statusLabel = input('');
    closeDateText = input('');
    commentCount = input(0);
    sortLabel = input('');

    edit = output<void>();
    toggleSort = output<void>();
}
