import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';

@Component({
  selector: 'app-public-poll-cta',
  standalone: true,
  imports: [DsButtonComponent, DsIconComponent, TranslatePipe],
  templateUrl: 'public-poll-cta.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicPollCtaComponent {
  size = input<'sm' | 'md'>('sm');
  isAuthenticated = input<boolean>(false);
  loginClick = output<void>();
  voteClick = output<void>();
}
