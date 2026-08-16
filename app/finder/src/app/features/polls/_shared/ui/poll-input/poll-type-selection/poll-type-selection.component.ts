import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { OptionType } from '../../../models/poll-detail.model';

@Component({
  selector: 'app-poll-type-selection',
  templateUrl: './poll-type-selection.component.html',
  styleUrl: './poll-type-selection.component.css',
  host: { class: 'block' },
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollTypeSelectionComponent {
  readonly OptionType = OptionType;
  typeSelected = output<OptionType>();
}
