import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UserAvatarComponent } from '@smart/user-avatar/user-avatar.component';
import { PollParticipant } from '../../models/poll-realtime.model';

/**
 * Shows who else is currently on the poll (live presence roster). The local user is filtered out
 * by id, so the stack only ever shows other people. Renders nothing when nobody else is present.
 */
@Component({
    selector: 'app-presence-avatars',
    templateUrl: './presence-avatars.component.html',
    imports: [UserAvatarComponent, TranslatePipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { style: 'display: contents' },
})
export class PresenceAvatarsComponent {
    participants = input<PollParticipant[]>([]);
    selfId = input<string | undefined>(undefined);
    max = input(3);

    protected readonly others = computed(() =>
        this.participants().filter((p) => p.userId !== this.selfId()),
    );

    protected readonly shown = computed(() =>
        this.others().slice(0, this.max()),
    );

    protected readonly extra = computed(
        () => this.others().length - this.shown().length,
    );

    protected avatarUser(participant: PollParticipant): {
        name: string | undefined;
    } {
        return { name: participant.name };
    }
}
