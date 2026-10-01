import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
    AvatarStackComponent,
    AvatarUser,
} from '@smart/avatar-stack/avatar-stack.component';
import { CommentAuthor } from '../../../models/poll-detail.model';
import { OptionVotersComponent } from '../../option-voters/option-voters.component';

/** Avatar row of a poll card: the crowned creator (when known), the other participants and who is still missing. */
@Component({
    selector: 'app-poll-item-voters',
    imports: [AvatarStackComponent, OptionVotersComponent],
    templateUrl: './poll-item-voters.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollItemVotersComponent {
    creator = input<CommentAuthor | undefined>(undefined);
    creatorVoted = input<boolean | undefined>(undefined);
    /** Everyone but the creator when a creator is given. */
    avatarUsers = input.required<AvatarUser[]>();
    missingVotersText = input.required<string>();
}
