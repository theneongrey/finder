import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    output,
} from '@angular/core';
import { AvatarUser } from '@smart/avatar-stack/avatar-stack.component';
import {
    OptionDetail,
    SharedWith,
} from '../../../../_shared/models/poll-detail.model';
import * as voteTally from '../../../../_shared/utils/vote-tally.utils';
import { OptionVotersComponent } from '../option-voters/option-voters.component';
import { OptionCardActionsComponent } from '../option-card-actions/option-card-actions.component';
import { OptionDeleteConfirmComponent } from '../option-delete-confirm/option-delete-confirm.component';

/**
 * Bottom of an option card, pinned to the card's foot: voters + tally summary, a divider, and
 * either the action row (discuss + inline voting) or, while a delete is pending, its prompt.
 */
@Component({
    selector: 'app-option-card-footer',
    templateUrl: './option-card-footer.component.html',
    imports: [
        OptionVotersComponent,
        OptionCardActionsComponent,
        OptionDeleteConfirmComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'mt-auto block' },
})
export class OptionCardFooterComponent {
    option = input.required<OptionDetail>();
    members = input<SharedWith[]>([]);
    /** Tally line next to the avatars, e.g. "2 × Yes · 1 × No". */
    summary = input('');
    mode = input<'yesno' | 'rating'>('yesno');
    commentCount = input(0);
    isClosed = input(false);
    /** Hidden while results are hidden. */
    showVoters = input(true);
    deleteConfirm = input(false);

    vote = output<string>();
    commentsClick = output<void>();
    deleteCancelled = output<void>();
    deleteConfirmed = output<void>();

    /** Everyone but the creator, who is shown separately with a crown. */
    protected readonly avatarUsers = computed((): AvatarUser[] =>
        voteTally.avatarUsers(
            this.option(),
            this.members(),
            this.option().creator.name,
        ),
    );

    protected readonly creatorVoted = computed(() =>
        voteTally.personVoted(this.option(), this.option().creator.name),
    );
}
