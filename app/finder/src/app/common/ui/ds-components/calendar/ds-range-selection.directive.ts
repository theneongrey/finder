import { Directive } from '@angular/core';
import {
    BrnCalendarRange,
    provideBrnCalendar,
} from '@spartan-ng/brain/calendar';

/**
 * Spartan's range calendar with a simpler click model: the first click picks
 * the start day, the second the end day. A second click before the start day
 * moves the start instead; the start day itself may also be the end day.
 * A click on a complete range starts a new one.
 */
@Directive({
    selector: '[fDsRangeSelection]',
    providers: [provideBrnCalendar(DsRangeSelection)],
})
export class DsRangeSelection<T> extends BrnCalendarRange<T> {
    override selectDate(date: T): void {
        const start = this.startDate();
        if (!start || this.endDate()) {
            this.startDate.set(date);
            this.endDate.set(undefined);
        } else if (this._dateAdapter.isBefore(date, start)) {
            this.startDate.set(date);
        } else {
            this.endDate.set(date);
        }
    }
}
