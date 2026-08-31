import {
    ChangeDetectionStrategy,
    Component,
    input,
    output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsCardComponent } from '@ds/card/ds-card.component';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { UserAvatarComponent } from '@smart/user-avatar/user-avatar.component';
import { ParticipantDisplay } from '../public-poll.models';

@Component({
    selector: 'app-public-poll-member-sidebar',
    standalone: true,
    imports: [
        DsCardComponent,
        DsButtonComponent,
        DsIconComponent,
        UserAvatarComponent,
        TranslatePipe,
    ],
    templateUrl: 'public-poll-member-sidebar.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicPollMemberSidebarComponent {
    hasVoted = input<boolean>(false);
    participants = input<ParticipantDisplay[]>([]);
    copyShareLink = output<void>();
}
