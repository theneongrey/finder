import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DsAvatarComponent } from '@ds/avatar/ds-avatar.component';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';

@Component({
    selector: 'app-polls-empty-state',
    imports: [
        RouterLink,
        TranslatePipe,
        DsAvatarComponent,
        DsButtonComponent,
        DsIconComponent,
    ],
    templateUrl: './polls-empty-state.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollsEmptyStateComponent {}
