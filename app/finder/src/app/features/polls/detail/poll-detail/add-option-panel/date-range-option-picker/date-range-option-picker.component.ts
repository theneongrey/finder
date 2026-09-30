import {
    ChangeDetectionStrategy,
    Component,
    input,
    linkedSignal,
    output,
    signal,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsRangeCalendarComponent } from '@ds/calendar/ds-range-calendar.component';
import { DateOptionEntry } from '../../../../_shared/models/date-option.model';
import { OptionTimeRangeRowComponent } from '../option-time-range-row/option-time-range-row.component';
import { injectToday, startOfDay } from '../today';

/**
 * Calendar picker for adding a single date-range option (optionally with a
 * start and end time). The first tapped day is the start, the second the end.
 */
@Component({
    selector: 'app-date-range-option-picker',
    templateUrl: './date-range-option-picker.component.html',
    imports: [
        TranslatePipe,
        DsRangeCalendarComponent,
        OptionTimeRangeRowComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeOptionPickerComponent {
    value = input.required<DateOptionEntry>();
    showTime = input(false);
    valueChange = output<DateOptionEntry>();

    /** Local copy of `value`: one calendar click can change start and end
     *  back to back, before the parent's new value flows back in. */
    protected readonly draft = linkedSignal(() => this.value());

    /** Earliest selectable day — rolls over at midnight if the panel stays open. */
    protected readonly today = injectToday();

    /** Month to show when nothing is selected — stays on the last picked month
     *  after an add clears the selection. */
    protected readonly viewAnchor = signal<Date | undefined>(undefined);

    setStartDate(date: Date | undefined): void {
        const day = date ? startOfDay(date) : undefined;
        if (day) {
            this.viewAnchor.set(day);
        }
        this.update({ date: day });
    }

    setEndDate(date: Date | undefined): void {
        this.update({ endDate: date ? startOfDay(date) : undefined });
    }

    protected update(change: Partial<DateOptionEntry>): void {
        const next = { ...this.draft(), ...change };
        this.draft.set(next);
        this.valueChange.emit(next);
    }
}
