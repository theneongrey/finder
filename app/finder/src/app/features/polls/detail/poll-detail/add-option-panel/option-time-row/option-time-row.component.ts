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
import { DsChipComponent } from '@ds/chip/ds-chip.component';
import { DsTimePickerComponent } from '@ds/time-picker/ds-time-picker.component';
import { DateOptionEntry } from '../../../../_shared/models/date-option.model';
import { DateOptionFormatService } from '../../../../_shared/utils/date-option-format.service';

/**
 * Time row of the add-option pickers: a time picker plus the times of the
 * existing options as quick picks. The drafted option always gets a time —
 * the most used existing time, else the next full hour.
 */
@Component({
    selector: 'app-option-time-row',
    templateUrl: './option-time-row.component.html',
    imports: [TranslatePipe, DsChipComponent, DsTimePickerComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionTimeRowComponent {
    private readonly dateFormat = inject(DateOptionFormatService);

    value = input.required<DateOptionEntry>();
    existing = input<DateOptionEntry[]>([]);
    /** Offer the existing options' times as quick-pick chips. */
    quickPicks = input(true);
    valueChange = output<DateOptionEntry>();

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
        effect(() => {
            const value = this.value();
            if (!value.startTime) {
                untracked(() =>
                    this.valueChange.emit({
                        ...value,
                        startTime: this.defaultTime(),
                    }),
                );
            }
        });
    }

    setTime(value: string | undefined): void {
        if (!value) {
            return;
        }
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
