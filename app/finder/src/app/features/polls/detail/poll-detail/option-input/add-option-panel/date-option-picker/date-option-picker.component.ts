import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    input,
    output,
    signal,
    untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { DsCalendarComponent } from '@ds/calendar/ds-calendar.component';
import { DsChipComponent } from '@ds/chip/ds-chip.component';
import { DsInputComponent } from '@ds/input/ds-input.component';
import { DateOptionEntry } from '../../../../../_shared/models/date-option.model';
import { DateOptionFormatService } from '../../../../../_shared/utils/date-option-format.service';

/**
 * Calendar picker for adding a single calendar-day option (optionally with a time).
 * Days that already have an option are marked; without a time they can't be picked
 * again, with a time they can (the parent rejects an exact date + time duplicate).
 * Times used by existing options are offered as quick picks.
 */
@Component({
    selector: 'app-date-option-picker',
    templateUrl: './date-option-picker.component.html',
    imports: [
        FormsModule,
        TranslatePipe,
        DsCalendarComponent,
        DsChipComponent,
        DsInputComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateOptionPickerComponent {
    private readonly dateFormat = inject(DateOptionFormatService);

    value = input.required<DateOptionEntry>();
    existing = input<DateOptionEntry[]>([]);
    showTime = input(false);
    duplicate = input(false);
    valueChange = output<DateOptionEntry>();

    protected readonly today = startOfDay(new Date());

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

    /** Distinct times of the existing options, earliest first. */
    protected readonly quickTimes = computed(() =>
        [
            ...new Set(
                this.existing()
                    .map((e) => e.startTime)
                    .filter((t): t is Date => !!t)
                    .map((t) => this.dateFormat.formatTimeInput(t)),
            ),
        ].sort(),
    );

    protected readonly timeValue = computed(() => {
        const t = this.value().startTime;
        return t ? this.dateFormat.formatTimeInput(t) : '';
    });

    constructor() {
        // A timed option always needs a time: default to the most used existing
        // time, else the next full hour.
        effect(() => {
            const value = this.value();
            if (this.showTime() && !value.startTime) {
                untracked(() =>
                    this.valueChange.emit({
                        ...value,
                        startTime: this.defaultTime(),
                    }),
                );
            }
        });
    }

    setDate(date: Date | undefined): void {
        const day = date ? startOfDay(date) : undefined;
        if (day) {
            this.viewAnchor.set(day);
        }
        this.valueChange.emit({ ...this.value(), date: day });
    }

    setTime(value: string): void {
        this.valueChange.emit({
            ...this.value(),
            startTime: this.dateFormat.parseTimeInput(value),
        });
    }

    private defaultTime(): Date {
        const counts = new Map<string, number>();
        for (const e of this.existing()) {
            if (e.startTime) {
                const key = this.dateFormat.formatTimeInput(e.startTime);
                counts.set(key, (counts.get(key) ?? 0) + 1);
            }
        }
        const mostUsed = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
        return mostUsed
            ? this.dateFormat.parseTimeInput(mostUsed[0])!
            : this.dateFormat.nextFullHour();
    }
}

function startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayKey(d: Date): string {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
