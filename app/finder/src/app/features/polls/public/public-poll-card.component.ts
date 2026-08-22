import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { DsCardComponent } from '../../../common/ui/ds-components/card/ds-card.component';
import { DsButtonComponent } from '../../../common/ui/ds-components/button/ds-button.component';
import { DsIconComponent } from '../../../common/ui/ds-components/icon/ds-icon.component';
import { DsStatusDotComponent } from '../../../common/ui/ds-components/badge/ds-status-dot.component';
import { AvatarStackComponent } from '../../../common/ui/smart-components/avatar-stack/avatar-stack.component';
import { PollTypeBadgeComponent } from '../_shared/ui/poll-type-badge/poll-type-badge.component';
import { PublicPollPreview } from '../_shared/models/poll-detail.model';

export interface OptionDisplay {
  id: string;
  text: string;
  description: string;
  voteCount: number;
  pct: string;
  isLead: boolean;
}

@Component({
  selector: 'app-public-poll-card',
  standalone: true,
  imports: [
    DsCardComponent,
    DsButtonComponent,
    DsIconComponent,
    DsStatusDotComponent,
    AvatarStackComponent,
    PollTypeBadgeComponent,
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
