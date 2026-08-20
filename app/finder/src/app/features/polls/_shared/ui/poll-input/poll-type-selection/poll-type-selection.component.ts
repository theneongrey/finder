import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { OptionType } from '../../../models/poll-detail.model';
import { PollTypeButtonComponent } from './poll-type-button.component';

@Component({
  selector: 'app-poll-type-selection',
  templateUrl: './poll-type-selection.component.html',
  styleUrl: './poll-type-selection.component.css',
  host: { class: 'block' },
  imports: [TranslatePipe, DsIconComponent, PollTypeButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollTypeSelectionComponent {
  selectedType = input<OptionType | undefined>(undefined);
  layout = input<'list' | 'grid'>('list');
  typeSelected = output<OptionType>();

  readonly pollTypes = [
    {
      type: OptionType.YesNo,
      iconName: 'checklist',
      nameKey: 'project.detail.pollTypes.yesNo',
      descKey: 'project.detail.pollTypes.yesNoDesc',
      testId: 'type-btn-yesno',
    },
    {
      type: OptionType.Date,
      iconName: 'calendar',
      nameKey: 'project.detail.pollTypes.appointment',
      descKey: 'project.detail.pollTypes.appointmentDesc',
      testId: 'type-btn-date',
    },
    {
      type: OptionType.Rating,
      iconName: 'star',
      nameKey: 'project.detail.pollTypes.rating',
      descKey: 'project.detail.pollTypes.ratingDesc',
      testId: 'type-btn-rating',
    },
  ];
}
