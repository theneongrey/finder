import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { OptionType } from '@common/models/option-type.model';
import { OptionTypeBadgeComponent } from '@smart/option-type-badge/option-type-badge.component';

@Component({
  selector: 'app-vote-progress-header',
  templateUrl: './vote-progress-header.component.html',
  imports: [TranslatePipe, OptionTypeBadgeComponent, DsIconComponent],
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
