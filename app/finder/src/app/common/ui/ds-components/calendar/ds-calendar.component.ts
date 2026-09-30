import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
    BrnCalendar,
    BrnCalendarImports,
    injectBrnCalendarI18n,
} from '@spartan-ng/brain/calendar';
import { injectDateAdapter } from '@spartan-ng/brain/date-time';
import { DsIconComponent } from '../icon/ds-icon.component';

/**
 * Month-grid date picker styled for the ds-* system. Wraps Spartan's BrnCalendar
 * for selection, keyboard navigation and a11y; only the visuals live here.
 *
 * - `[(date)]` — the single selected day (clicking it again clears it).
 * - `min` — earlier days are disabled, and the "previous month" arrow is hidden
 *   while showing the month that contains `min`.
 * - `highlightDays` — days rendered as "already taken" (muted fill + dot).
 * - `dateDisabled` — predicate for further unselectable days.
 */
@Component({
    selector: 'ds-calendar',
    imports: [BrnCalendarImports, DsIconComponent],
    templateUrl: './ds-calendar.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    hostDirectives: [
        {
            directive: BrnCalendar,
            inputs: [
                'min',
                'max',
                'disabled',
                'date',
                'dateDisabled',
                'weekStartsOn',
                'highlightDays',
                'defaultFocusedDate',
            ],
            outputs: ['dateChange', 'focusedDateChange'],
        },
    ],
    host: { class: 'block' },
})
export class DsCalendarComponent {
    protected readonly i18n = injectBrnCalendarI18n();
    protected readonly dateAdapter = injectDateAdapter<Date>();
    private readonly calendar = inject<BrnCalendar<Date>>(BrnCalendar);

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
