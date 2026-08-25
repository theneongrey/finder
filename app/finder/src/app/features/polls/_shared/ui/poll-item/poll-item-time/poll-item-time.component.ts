import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { TimeSincePipe } from '@common/ui/pipes/time-ago.pipe';

@Component({
  selector: 'app-poll-item-time',
  imports: [DatePipe, TranslatePipe, TimeSincePipe, DsIconComponent],
  templateUrl: './poll-item-time.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollItemTimeComponent {
  closeDate = input<string | undefined>(undefined);
  isClosed = input.required<boolean>();
  lastVoteAt = input<string | undefined>(undefined);
}
