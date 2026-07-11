import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
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

  isEditing = signal(false);

  selectedTypeInfo = computed(() => this.types.find((t) => t.type === this.selectedType()));

  constructor() {
    effect(() => {
      if (this.selectedType()) {
        this.isEditing.set(false);
      }
    });
  }

  readonly types: { type: DateOptionType; labelKey: string; icon: string }[] = [
    {
      type: 'weekday',
      labelKey: 'project.pollInput.date.types.weekday',
      icon: 'fa-solid fa-rotate',
    },
    {
      type: 'date',
      labelKey: 'project.pollInput.date.types.date',
      icon: 'fa-regular fa-calendar-xmark',
    },
    {
      type: 'date-range',
      labelKey: 'project.pollInput.date.types.dateRange',
      icon: 'fa-regular fa-calendar-days',
    },
    {
      type: 'time',
      labelKey: 'project.pollInput.date.types.time',
      icon: 'fa-regular fa-alarm-clock',
    },
    {
      type: 'time-range',
      labelKey: 'project.pollInput.date.types.timeRange',
      icon: 'fa-regular fa-clock',
    },
  ];
}
