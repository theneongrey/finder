import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    input,
    output,
    untracked,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsTimePickerComponent } from '@ds/time-picker/ds-time-picker.component';
import { DateOptionEntry } from '../../../../_shared/models/date-option.model';
import { DateOptionFormatService } from '../../../../_shared/utils/date-option-format.service';

/**
 * "From / to" time row of the add-option pickers (date ranges with times and
 * time ranges). The drafted option always gets both times — the next full hour
 * and an hour later — and a same-day range must end after it starts.
 */
@Component({
    selector: 'app-option-time-range-row',
    templateUrl: './option-time-range-row.component.html',
    imports: [TranslatePipe, DsTimePickerComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'flex flex-col gap-2' },
})
export class OptionTimeRangeRowComponent {
    private readonly dateFormat = inject(DateOptionFormatService);

    value = input.required<DateOptionEntry>();
    valueChange = output<DateOptionEntry>();

    protected readonly startTimeValue = computed(() =>
        this.formatTime(this.value().startTime),
    );
    protected readonly endTimeValue = computed(() =>
        this.formatTime(this.value().endTime),
    );

    protected readonly endTimeNotAfterStart = computed(
        () => !this.dateFormat.hasValidRangeTimes(this.value()),
    );

    constructor() {
        effect(() => {
            const value = this.value();
            if (!value.startTime || !value.endTime) {
                const start = this.dateFormat.nextFullHour();
                untracked(() =>
                    this.valueChange.emit({
                        ...value,
                        startTime: value.startTime ?? start,
                        endTime:
                            value.endTime ??
                            this.dateFormat.defaultEndTime(start),
                    }),
                );
            }
        });
    }

    setTime(field: 'startTime' | 'endTime', value: string | undefined): void {
        if (value) {
            this.valueChange.emit({
                ...this.value(),
                [field]: this.dateFormat.parseTimeInput(value),
            });
        }
    }

    private formatTime(t: Date | undefined): string {
        return t ? this.dateFormat.formatTimeInput(t) : '';
    }
}
