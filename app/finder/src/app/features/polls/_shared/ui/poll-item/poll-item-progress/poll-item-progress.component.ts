import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsProgressBarComponent } from '@ds/progress-bar/ds-progress-bar.component';
import {
    AvatarStackComponent,
    AvatarUser,
} from '@smart/avatar-stack/avatar-stack.component';

@Component({
    selector: 'app-poll-item-progress',
    imports: [TranslatePipe, DsProgressBarComponent, AvatarStackComponent],
    templateUrl: './poll-item-progress.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollItemProgressComponent {
    progressPercent = input.required<number>();
    votedCount = input.required<number>();
    totalParticipants = input.required<number>();
    avatarUsers = input.required<AvatarUser[]>();
    missingVotersText = input.required<string>();
}
