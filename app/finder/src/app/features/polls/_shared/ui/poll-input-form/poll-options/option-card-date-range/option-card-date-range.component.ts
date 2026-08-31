import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import { formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { DsInputComponent } from '@ds/input/ds-input.component';
import { DsCardComponent } from '@ds/card/ds-card.component';
import { DateOptionFormatService } from '../../../../utils/date-option-format.service';
import { DateOptionEntry } from '../../../../models/date-option.model';

@Component({
    selector: 'app-option-card-date-range',
    templateUrl: './option-card-date-range.component.html',
    imports: [
        FormsModule,
        DsButtonComponent,
        DsIconComponent,
        DsInputComponent,
        DsCardComponent,
        TranslatePipe,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardDateRangeComponent {
    private readonly dateOptionFormat = inject(DateOptionFormatService);

    option = input.required<DateOptionEntry>();
    index = input.required<number>();
    canRemove = input<boolean>(false);
    initialShowTime = input<boolean>(false);
    readonly = input<boolean>(false);
    remove = output<void>();
    optionChange = output<DateOptionEntry>();

    showTime = signal(false);
    startDate = signal<Date | undefined>(undefined);
    endDate = signal<Date | undefined>(undefined);

    readonly endBeforeStart = computed(() => {
        const start = this.startDate();
        const end = this.endDate();
        return start !== undefined && end !== undefined && end < start;
    });

    readonly formattedStartDate = computed(() => {
        const date = this.startDate();
        return date ? formatDate(date, 'mediumDate', 'en') : '';
    });

    constructor() {
        effect(() => {
            const opt = this.option();
            this.startDate.set(opt.date);
            this.endDate.set(opt.endDate);
            const shouldShow =
                !!(opt.startTime || opt.endTime) || this.initialShowTime();
            if (shouldShow) {
                if (this.initialShowTime() && !opt.startTime) {
                    const start = this.dateOptionFormat.nextFullHour();
                    const end = new Date(start);
                    end.setHours(end.getHours() + 1);
                    this.optionChange.emit({
                        ...opt,
                        startTime: start,
                        endTime: end,
                    });
                }
                this.showTime.set(true);
            } else {
                this.showTime.set(false);
            }
        });
    }

    get startDateValue(): string {
        const d = this.startDate();
        return d ? formatDate(d, 'yyyy-MM-dd', 'en') : '';
    }

    get endDateValue(): string {
        const d = this.endDate();
        return d ? formatDate(d, 'yyyy-MM-dd', 'en') : '';
    }

    setStartDate(value: string): void {
        const d = value ? this.parseDate(value) : undefined;
        this.startDate.set(d);
        this.optionChange.emit({ ...this.option(), date: d });
    }

    setEndDate(value: string): void {
        const d = value ? this.parseDate(value) : undefined;
        this.endDate.set(d);
        this.optionChange.emit({ ...this.option(), endDate: d });
    }

    get startTimeValue(): string {
        return this.option().startTime
            ? this.dateOptionFormat.formatTimeInput(this.option().startTime!)
            : '';
    }

    get endTimeValue(): string {
        return this.option().endTime
            ? this.dateOptionFormat.formatTimeInput(this.option().endTime!)
            : '';
    }

    setStartTime(value: string): void {
        this.optionChange.emit({
            ...this.option(),
            startTime: this.dateOptionFormat.parseTimeInput(value),
        });
    }

    setEndTime(value: string): void {
        this.optionChange.emit({
            ...this.option(),
            endTime: this.dateOptionFormat.parseTimeInput(value),
        });
    }

    private parseDate(value: string): Date {
        const [y, m, d] = value.split('-').map(Number);
        return new Date(y, m - 1, d);
    }
}
