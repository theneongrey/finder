import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    output,
    signal,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsCalendarComponent } from '@ds/calendar/ds-calendar.component';
import { DateOptionEntry } from '../../../../_shared/models/date-option.model';
import { OptionTimeRowComponent } from '../option-time-row/option-time-row.component';
import { injectToday, startOfDay } from '../today';

/**
 * Calendar picker for adding a single calendar-day option (optionally with a time).
 * Days that already have an option are marked; without a time they can't be picked
 * again, with a time they can.
 */
@Component({
    selector: 'app-date-option-picker',
    templateUrl: './date-option-picker.component.html',
    imports: [TranslatePipe, DsCalendarComponent, OptionTimeRowComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateOptionPickerComponent {
    value = input.required<DateOptionEntry>();
    existing = input<DateOptionEntry[]>([]);
    showTime = input(false);
    valueChange = output<DateOptionEntry>();

    /** Earliest selectable day — rolls over at midnight if the panel stays open. */
    protected readonly today = injectToday();

    /** Month to show when nothing is selected — stays on the last picked day's month
     *  after an add clears the selection, so adding several days in one month is quick. */
    protected readonly viewAnchor = signal<Date | undefined>(undefined);

    protected readonly takenDays = computed(() =>
        this.existing()
            .map((e) => e.date)
            .filter((d): d is Date => !!d),
    );

    /** Without a time, a day can only be proposed once. */
    protected readonly isDayDisabled = computed(() => {
        if (this.showTime()) {
            return () => false;
        }
        const taken = new Set(this.takenDays().map((d) => dayKey(d)));
        return (d: Date) => taken.has(dayKey(d));
    });

    setDate(date: Date | undefined): void {
        const day = date ? startOfDay(date) : undefined;
        if (day) {
            this.viewAnchor.set(day);
        }
        this.valueChange.emit({ ...this.value(), date: day });
    }
}

function dayKey(d: Date): string {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
