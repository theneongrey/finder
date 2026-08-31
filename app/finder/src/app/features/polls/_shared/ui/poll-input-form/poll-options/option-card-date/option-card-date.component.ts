import {
    ChangeDetectionStrategy,
    Component,
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
import { DsInputComponent } from '@ds/input/ds-input.component';
import { DsCardComponent } from '@ds/card/ds-card.component';
import { DateOptionFormatService } from '../../../../utils/date-option-format.service';
import { DateOptionEntry } from '../../../../models/date-option.model';

@Component({
    selector: 'app-option-card-date',
    templateUrl: './option-card-date.component.html',
    imports: [
        FormsModule,
        DsButtonComponent,
        DsInputComponent,
        DsCardComponent,
        TranslatePipe,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardDateComponent {
    private readonly dateOptionFormat = inject(DateOptionFormatService);

    option = input.required<DateOptionEntry>();
    index = input.required<number>();
    canRemove = input<boolean>(false);
    initialShowTime = input<boolean>(false);
    readonly = input<boolean>(false);
    remove = output<void>();
    optionChange = output<DateOptionEntry>();

    showTime = signal(false);

    constructor() {
        effect(() => {
            const opt = this.option();
            const shouldShow = !!opt.startTime || this.initialShowTime();
            if (shouldShow) {
                if (this.initialShowTime() && !opt.startTime) {
                    this.optionChange.emit({
                        ...opt,
                        startTime: this.dateOptionFormat.nextFullHour(),
                    });
                }
                this.showTime.set(true);
            } else {
                this.showTime.set(false);
            }
        });
    }

    get dateValue(): string {
        const d = this.option().date;
        return d ? formatDate(d, 'yyyy-MM-dd', 'en') : '';
    }

    setDate(value: string): void {
        if (!value) {
            this.optionChange.emit({ ...this.option(), date: undefined });
            return;
        }
        const [y, m, d] = value.split('-').map(Number);
        this.optionChange.emit({
            ...this.option(),
            date: new Date(y, m - 1, d),
        });
    }

    get timeValue(): string {
        return this.option().startTime
            ? this.dateOptionFormat.formatTimeInput(this.option().startTime!)
            : '';
    }

    setStartTime(value: string): void {
        this.optionChange.emit({
            ...this.option(),
            startTime: this.dateOptionFormat.parseTimeInput(value),
        });
    }
}
