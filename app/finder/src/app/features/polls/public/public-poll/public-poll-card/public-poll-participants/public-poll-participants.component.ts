import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AvatarStackComponent } from '../../../../../../common/ui/smart-components/avatar-stack/avatar-stack.component';

@Component({
  selector: 'app-public-poll-participants',
  standalone: true,
  imports: [AvatarStackComponent, TranslatePipe],
  templateUrl: 'public-poll-participants.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicPollParticipantsComponent {
  participantCount = input.required<number>();
  participantSlots = input<unknown[]>([]);
  participantAvatarUsers = input<{ name: string; voted: boolean }[]>([]);
  isAuthenticated = input<boolean>(false);
  size = input<'sm' | 'md'>('sm');
}
