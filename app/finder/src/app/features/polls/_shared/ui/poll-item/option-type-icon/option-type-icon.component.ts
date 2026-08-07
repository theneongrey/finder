import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { OptionType } from '../../../models/poll-detail.model';

@Component({
  selector: 'app-option-type-icon',
  imports: [],
  templateUrl: './option-type-icon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionTypeIconComponent {
  type = input.required<OptionType>();
  readonly OptionType = OptionType;
}
