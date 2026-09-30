import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
    BrnCalendarImports,
    injectBrnCalendarI18n,
} from '@spartan-ng/brain/calendar';
import { injectDateAdapter } from '@spartan-ng/brain/date-time';
import { DsIconComponent } from '../icon/ds-icon.component';
import { DsRangeSelection } from './ds-range-selection.directive';

/**
 * Month-grid date-range picker, the range sibling of `ds-calendar`.
 *
 * - `[(startDate)]` / `[(endDate)]` — the selected range. The first click picks
 *   the start, the second the end (a day before the start moves the start).
 * - `min`, `dateDisabled`, `weekStartsOn`, `defaultFocusedDate` — as on `ds-calendar`.
 */
@Component({
    selector: 'ds-range-calendar',
    imports: [BrnCalendarImports, DsIconComponent],
    templateUrl: './ds-range-calendar.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    hostDirectives: [
        {
            directive: DsRangeSelection,
            inputs: [
                'min',
                'max',
                'disabled',
                'startDate',
                'endDate',
                'dateDisabled',
                'weekStartsOn',
                'defaultFocusedDate',
            ],
            outputs: ['startDateChange', 'endDateChange', 'focusedDateChange'],
        },
    ],
    host: { class: 'block' },
})
export class DsRangeCalendarComponent {
    protected readonly i18n = injectBrnCalendarI18n();
    protected readonly dateAdapter = injectDateAdapter<Date>();
    private readonly calendar =
        inject<DsRangeSelection<Date>>(DsRangeSelection);

    protected heading(): string {
        const focused = this.calendar.focusedDate();
        return this.i18n
            .config()
            .formatHeader(
                this.dateAdapter.getMonth(focused),
                this.dateAdapter.getYear(focused),
            );
    }
}
