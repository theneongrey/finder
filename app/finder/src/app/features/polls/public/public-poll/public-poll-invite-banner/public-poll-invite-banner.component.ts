import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsIconComponent } from '../../../../../common/ui/ds-components/icon/ds-icon.component';

@Component({
  selector: 'app-public-poll-invite-banner',
  standalone: true,
  imports: [DsIconComponent, TranslatePipe],
  templateUrl: 'public-poll-invite-banner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicPollInviteBannerComponent {
  isAuthenticated = input<boolean>(false);
  userName = input<string>('');
  projectName = input<string>('');
}
