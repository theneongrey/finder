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
import { TranslatePipe } from '@ngx-translate/core';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { OptionType } from '@common/models/option-type.model';
import { OptionCardComponent } from '../poll-options/option-card/option-card.component';
import { OptionCardDateComponent } from '../poll-options/option-card-date/option-card-date.component';
import { OptionCardWeekdayComponent } from '../poll-options/option-card-weekday/option-card-weekday.component';
import { OptionCardDateRangeComponent } from '../poll-options/option-card-date-range/option-card-date-range.component';
import { OptionCardTimeComponent } from '../poll-options/option-card-time/option-card-time.component';
import { OptionCardTimeRangeComponent } from '../poll-options/option-card-time-range/option-card-time-range.component';
import { OptionEntry } from '../poll-options/poll-options.component';
import {
    DateOptionEntry,
    DateOptionType,
    isDateOptionType,
} from '../../../../_shared/models/date-option.model';
import { DateOptionFormatService } from '../../../../_shared/utils/date-option-format.service';
import { UrlValidationService } from '../../../../_shared/utils/url-validation.service';
import { POLL_LIMITS } from '../../../../_shared/models/poll-limits';

export interface NewOptionPayload {
    text: string;
    description: string;
    meta?: OptionEntry['meta'];
}

/**
 * Inline panel to add a single option from the results view. Renders the same
 * per-type option input used for creating and editing polls, wrapped with an
 * "add" action that emits the option ready to be persisted.
 */
@Component({
    selector: 'app-add-option-panel',
    templateUrl: './add-option-panel.component.html',
    imports: [
        TranslatePipe,
        DsButtonComponent,
        OptionCardComponent,
        OptionCardDateComponent,
        OptionCardWeekdayComponent,
        OptionCardDateRangeComponent,
        OptionCardTimeComponent,
        OptionCardTimeRangeComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddOptionPanelComponent {
    private readonly dateFormat = inject(DateOptionFormatService);
    private readonly urlValidation = inject(UrlValidationService);

    readonly OptionType = OptionType;

    optionType = input.required<OptionType>();
    dateType = input<DateOptionType | undefined>(undefined);
    showTime = input<boolean>(false);
    submitting = input<boolean>(false);

    readonly isDateType = computed(() => isDateOptionType(this.optionType()));

    add = output<NewOptionPayload>();
    cancelled = output<void>();

    readonly textDraft = signal<OptionEntry>({ text: '', description: '' });
    readonly dateDraft = signal<DateOptionEntry>({ type: 'date' });

    constructor() {
        // (Re)initialise the date draft whenever the poll's date sub-type changes.
        effect(() => {
            const type = this.dateType();
            if (type) {
                this.dateDraft.set(this.freshDateEntry(type));
            }
        });
    }

    readonly isValid = computed(() => {
        if (isDateOptionType(this.optionType())) {
            return this.dateFormat.isValid(this.dateDraft());
        }
        const draft = this.textDraft();
        return (
            !!draft.text.trim() &&
            draft.text.length <= POLL_LIMITS.optionTextLength &&
            (!draft.meta?.url || this.urlValidation.isValid(draft.meta.url))
        );
    });

    submit(): void {
        if (!this.isValid()) {
            return;
        }
        if (isDateOptionType(this.optionType())) {
            this.add.emit({
                text: this.dateFormat.serialize(this.dateDraft()),
                description: '',
            });
            this.dateDraft.set(this.freshDateEntry(this.dateType()!));
        } else {
            const draft = this.textDraft();
            this.add.emit({
                text: draft.text.trim(),
                description: draft.description,
                meta: draft.meta,
            });
            this.textDraft.set({ text: '', description: '' });
        }
    }

    private freshDateEntry(type: DateOptionType): DateOptionEntry {
        if (type === 'time') {
            return { type, startTime: this.dateFormat.nextFullHour() };
        }
        if (type === 'time-range') {
            const start = this.dateFormat.nextFullHour();
            const end = new Date(start);
            end.setHours(end.getHours() + 1);
            return { type, startTime: start, endTime: end };
        }
        return { type };
    }
}
