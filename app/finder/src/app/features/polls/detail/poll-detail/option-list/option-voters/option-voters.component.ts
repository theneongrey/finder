import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import {
    AvatarStackComponent,
    AvatarUser,
} from '@smart/avatar-stack/avatar-stack.component';
import { UserAvatarComponent } from '@smart/user-avatar/user-avatar.component';
import { CommentAuthor } from '../../../../_shared/models/poll-detail.model';

/** Avatar row of an option card: the option's creator (crowned) followed by the other voters. */
@Component({
    selector: 'app-option-voters',
    templateUrl: './option-voters.component.html',
    imports: [
        TranslatePipe,
        DsIconComponent,
        AvatarStackComponent,
        UserAvatarComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionVotersComponent {
    creator = input.required<CommentAuthor>();
    /** Whether the creator voted; undefined hides the vote badge. */
    creatorVoted = input<boolean | undefined>(undefined);
    /** Everyone else — the creator must already be filtered out. */
    users = input<AvatarUser[]>([]);
    max = input(4);
}
