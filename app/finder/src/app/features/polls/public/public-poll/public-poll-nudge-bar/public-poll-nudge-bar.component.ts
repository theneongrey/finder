import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsButtonComponent } from '@ds/button/ds-button.component';

@Component({
  selector: 'app-public-poll-nudge-bar',
  standalone: true,
  imports: [DsButtonComponent, TranslatePipe],
  templateUrl: 'public-poll-nudge-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class PublicPollNudgeBarComponent {
  loginClick = output<void>();
}
