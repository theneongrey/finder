import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    output,
} from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DateOptionEntry } from '../../../../_shared/models/date-option.model';
import { OptionTimeRowComponent } from '../option-time-row/option-time-row.component';

/**
 * Weekday tiles for adding a single weekday option (optionally with a time).
 * Weekdays that already have an option are greyed; without a time they can't be
 * picked again, with a time they can.
 */
@Component({
    selector: 'app-weekday-option-picker',
    templateUrl: './weekday-option-picker.component.html',
    imports: [TranslatePipe, OptionTimeRowComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekdayOptionPickerComponent {
    private readonly translate = inject(TranslateService);

    value = input.required<DateOptionEntry>();
    existing = input<DateOptionEntry[]>([]);
    showTime = input(false);
    valueChange = output<DateOptionEntry>();

    protected readonly days = computed(() => {
        const taken = new Set(this.existing().map((e) => e.weekday));
        const selected = this.value().weekday;
        return [1, 2, 3, 4, 5, 6, 0].map((v) => ({
            value: v,
            label: this.translate.instant(
                `project.pollInput.date.weekdaysShort.${v}`,
            ),
            ariaLabel: this.translate.instant(
                `project.pollInput.date.weekdays.${v}`,
            ),
            selected: selected === v,
            taken: taken.has(v),
            // Without a time, a weekday can only be proposed once.
            disabled: taken.has(v) && !this.showTime(),
        }));
    });

    selectWeekday(weekday: number): void {
        this.valueChange.emit({ ...this.value(), weekday });
    }
}
