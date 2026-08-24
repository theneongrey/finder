import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { OptionType } from '../../../_shared/models/poll-detail.model';
import { PollTypeBadgeComponent } from '../../../_shared/ui/poll-type-badge/poll-type-badge.component';
import { DsIconComponent } from '../../../../../common/ui/ds-components/icon/ds-icon.component';

@Component({
  selector: 'app-vote-progress-header',
  templateUrl: './vote-progress-header.component.html',
  imports: [TranslatePipe, PollTypeBadgeComponent, DsIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteProgressHeaderComponent {
  optionType = input(OptionType.YesNo);
  closeDateDisplay = input<string | undefined>(undefined);
  currentIndex = input(0);
  total = input(0);
  progressPercent = input(0);
  progressSegments = input<string[]>([]);
}
