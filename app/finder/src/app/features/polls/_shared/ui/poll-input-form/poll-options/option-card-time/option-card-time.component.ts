import {
    ChangeDetectionStrategy,
    Component,
    inject,
    input,
    output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsInputComponent } from '@ds/input/ds-input.component';
import { DsCardComponent } from '@ds/card/ds-card.component';
import { DateOptionFormatService } from '../../../../utils/date-option-format.service';
import { DateOptionEntry } from '../../../../models/date-option.model';

@Component({
    selector: 'app-option-card-time',
    templateUrl: './option-card-time.component.html',
    imports: [
        FormsModule,
        DsButtonComponent,
        DsInputComponent,
        DsCardComponent,
        TranslatePipe,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardTimeComponent {
    private readonly dateOptionFormat = inject(DateOptionFormatService);

    option = input.required<DateOptionEntry>();
    index = input.required<number>();
    canRemove = input<boolean>(false);
    readonly = input<boolean>(false);
    remove = output<void>();
    optionChange = output<DateOptionEntry>();

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
