import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { DsCardComponent } from '../../../../../common/ui/ds-components/card/ds-card.component';
import { DsButtonComponent } from '../../../../../common/ui/ds-components/button/ds-button.component';
import { DsInputComponent } from '../../../../../common/ui/ds-components/input/ds-input.component';
import { DsIconComponent } from '../../../../../common/ui/ds-components/icon/ds-icon.component';

@Component({
  selector: 'app-public-poll-guest-sidebar',
  standalone: true,
  imports: [DsCardComponent, DsButtonComponent, DsInputComponent, DsIconComponent, ReactiveFormsModule, TranslatePipe],
  templateUrl: 'public-poll-guest-sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicPollGuestSidebarComponent {
  emailControl = input.required<FormControl>();
  perks = input<string[]>([]);
  loginClick = output<void>();
}
