import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { OptionDisplay } from './public-poll.models';

@Component({
  selector: 'app-public-poll-options',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: 'public-poll-options.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicPollOptionsComponent {
  optionDisplays = input.required<OptionDisplay[]>();
  totalVotes = input.required<number>();
  size = input<'sm' | 'md'>('sm');
}
