import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsAvatarComponent } from '@ds/avatar/ds-avatar.component';
import { DsProgressBarComponent } from '@ds/progress-bar/ds-progress-bar.component';
import { ParticipantAvatar } from '../poll-item.component';

@Component({
  selector: 'app-poll-item-progress',
  imports: [TranslatePipe, DsProgressBarComponent, DsAvatarComponent],
  templateUrl: './poll-item-progress.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollItemProgressComponent {
  progressPercent = input.required<number>();
  votedCount = input.required<number>();
  totalParticipants = input.required<number>();
  participantAvatars = input.required<ParticipantAvatar[]>();
  missingVotersText = input.required<string>();
}
