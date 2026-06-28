import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AddCardComponent } from '../../../../../common/ui/components/add-card/add-card.component';
import { OptionType } from '../../../_models/project-detail.model';

@Component({
  selector: 'app-topic-type-selection',
  templateUrl: './topic-type-selection.component.html',
  host: { class: 'tw:h-full tw:flex tw:flex-col' },
  imports: [AddCardComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicTypeSelectionComponent {
  readonly OptionType = OptionType;
  typeSelected = output<OptionType>();
}
