import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { DsCardComponent } from '@ds/card/ds-card.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { DsStatusDotComponent } from '@ds/badge/ds-status-dot.component';
import { PublicPollPreview } from '../../polls/_shared/models/poll-detail.model';
import { PublicPollParticipantsComponent } from './public-poll-participants/public-poll-participants.component';
import { PublicPollOptionsComponent } from './public-poll-options/public-poll-options.component';
import { PublicPollCtaComponent } from './public-poll-cta/public-poll-cta.component';
import { OptionDisplay } from '../public-poll.models';
import { OptionTypeBadgeComponent } from '@smart/option-type-badge/option-type-badge.component';

export type { OptionDisplay };

@Component({
  selector: 'app-public-poll-card',
  standalone: true,
  imports: [
    DsCardComponent,
    DsIconComponent,
    DsStatusDotComponent,
    OptionTypeBadgeComponent,
    PublicPollParticipantsComponent,
    PublicPollOptionsComponent,
    PublicPollCtaComponent,
    TranslatePipe,
    DatePipe,
  ],
  templateUrl: 'public-poll-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicPollCardComponent {
  poll = input.required<PublicPollPreview>();
  optionDisplays = input.required<OptionDisplay[]>();
  participantSlots = input<unknown[]>([]);
  participantAvatarUsers = input<{ name: string; voted: boolean }[]>([]);
  isAuthenticated = input<boolean>(false);
  size = input<'sm' | 'md'>('sm');

  loginClick = output<void>();
  voteClick = output<void>();
}
