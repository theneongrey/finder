import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { OptionDisplay } from '../../public-poll.models';
import { PublicPollOptionComponent } from './public-poll-option/public-poll-option.component';

@Component({
  selector: 'app-public-poll-options',
  standalone: true,
  imports: [TranslatePipe, PublicPollOptionComponent],
  templateUrl: 'public-poll-options.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicPollOptionsComponent {
  optionDisplays = input.required<OptionDisplay[]>();
  totalVotes = input.required<number>();
  size = input<'sm' | 'md'>('sm');
}
