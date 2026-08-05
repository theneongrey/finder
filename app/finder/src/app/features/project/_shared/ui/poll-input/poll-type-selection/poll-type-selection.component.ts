import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AddCardComponent } from '../../../../../../common/ui/components/add-card/add-card.component';
import { OptionType } from '../../../models/project-detail.model';

@Component({
  selector: 'app-poll-type-selection',
  templateUrl: './poll-type-selection.component.html',
  host: { class: 'h-full flex flex-col' },
  imports: [AddCardComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollTypeSelectionComponent {
  readonly OptionType = OptionType;
  typeSelected = output<OptionType>();
}
