import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DateOptionType } from '../../../../utils/date-option.utils';

@Component({
  selector: 'app-appointment-type-selection',
  templateUrl: './appointment-type-selection.component.html',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentTypeSelectionComponent {
  selectedType = input<DateOptionType | undefined>(undefined);
  typeSelected = output<DateOptionType>();

  readonly types: { type: DateOptionType; labelKey: string }[] = [
    { type: 'weekday',    labelKey: 'project.pollInput.date.types.weekday' },
    { type: 'date',       labelKey: 'project.pollInput.date.types.date' },
    { type: 'date-range', labelKey: 'project.pollInput.date.types.dateRange' },
    { type: 'time',       labelKey: 'project.pollInput.date.types.time' },
    { type: 'time-range', labelKey: 'project.pollInput.date.types.timeRange' },
  ];
}
