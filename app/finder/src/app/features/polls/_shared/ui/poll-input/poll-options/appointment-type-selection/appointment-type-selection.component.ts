import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsCardComponent } from '@ds/card/ds-card.component';
import { DateOptionType } from '../../../../utils/date-option.utils';

@Component({
  selector: 'app-appointment-type-selection',
  templateUrl: './appointment-type-selection.component.html',
  imports: [TranslatePipe, DsCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentTypeSelectionComponent {
  selectedType = input<DateOptionType | undefined>(undefined);
  showTime = input<boolean>(false);
  typeSelected = output<DateOptionType>();
  showTimeChange = output<boolean>();

  readonly types: { type: DateOptionType; labelKey: string }[] = [
    { type: 'date',       labelKey: 'project.pollInput.date.types.date' },
    { type: 'weekday',    labelKey: 'project.pollInput.date.types.weekday' },
    { type: 'date-range', labelKey: 'project.pollInput.date.types.dateRange' },
    { type: 'time',       labelKey: 'project.pollInput.date.types.time' },
    { type: 'time-range', labelKey: 'project.pollInput.date.types.timeRange' },
  ];

  readonly canHaveTime = computed(() =>
    ['date', 'weekday', 'date-range'].includes(this.selectedType() ?? ''),
  );
}
