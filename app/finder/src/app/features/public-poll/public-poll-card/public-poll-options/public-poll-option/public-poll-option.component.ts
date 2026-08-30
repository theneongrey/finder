import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { OptionDisplay } from '../../../public-poll.models';

@Component({
  selector: 'app-public-poll-option',
  templateUrl: './public-poll-option.component.html',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicPollOptionComponent {
  opt = input.required<OptionDisplay>();
  size = input<'sm' | 'md'>('sm');
}
