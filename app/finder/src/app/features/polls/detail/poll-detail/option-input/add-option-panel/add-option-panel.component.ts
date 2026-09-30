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
import { OptionEntry } from '../poll-options/poll-options.component';
import {
    DateOptionEntry,
    DateOptionType,
    isDateOptionType,
} from '../../../../_shared/models/date-option.model';
import { DateOptionFormatService } from '../../../../_shared/utils/date-option-format.service';
import { UrlValidationService } from '../../../../_shared/utils/url-validation.service';
import { POLL_LIMITS } from '../../../../_shared/models/poll-limits';
import { DateOptionPickerComponent } from './date-option-picker/date-option-picker.component';
import { DateRangeOptionPickerComponent } from './date-range-option-picker/date-range-option-picker.component';
import { OptionTimeRangeRowComponent } from './option-time-range-row/option-time-range-row.component';
import { OptionTimeRowComponent } from './option-time-row/option-time-row.component';
import { WeekdayOptionPickerComponent } from './weekday-option-picker/weekday-option-picker.component';

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
        DateOptionPickerComponent,
        OptionCardComponent,
        WeekdayOptionPickerComponent,
        DateRangeOptionPickerComponent,
        OptionTimeRowComponent,
        OptionTimeRangeRowComponent,
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
    /** Raw texts of the poll's current options — marks taken days in the calendar. */
    existingOptions = input<string[]>([]);

    readonly isDateType = computed(() => isDateOptionType(this.optionType()));
    /** Calendar-day polls get the month-grid picker instead of the generic date card. */
    readonly usesCalendar = computed(
        () => this.isDateType() && this.dateType() === 'date',
    );
    /** Weekday polls get the weekday-tile picker. */
    readonly usesWeekdayPicker = computed(
        () => this.isDateType() && this.dateType() === 'weekday',
    );
    /** Date-range polls get the range calendar. */
    /** Time polls get the plain time picker. */
    readonly usesTimePicker = computed(
        () => this.isDateType() && this.dateType() === 'time',
    );
    /** Time-range polls get the from/to time pickers. */
    readonly usesTimeRangePicker = computed(
        () => this.isDateType() && this.dateType() === 'time-range',
    );
    readonly usesRangePicker = computed(
        () => this.isDateType() && this.dateType() === 'date-range',
    );

    readonly existingDates = computed<DateOptionEntry[]>(() => {
        const type = this.dateType();
        return this.usesCalendar() || this.usesWeekdayPicker()
            ? this.existingOptions().map((text) =>
                  this.dateFormat.parse(text, type!),
              )
            : [];
    });

    /** The drafted option is already an option (compared in normalised form). */
    readonly isDuplicate = computed(() => {
        const type = this.dateType();
        const draft = this.dateDraft();
        const checked =
            this.usesCalendar() ||
            this.usesWeekdayPicker() ||
            this.usesRangePicker() ||
            this.usesTimePicker() ||
            this.usesTimeRangePicker();
        if (!checked || !type || !this.dateFormat.isValid(draft)) {
            return false;
        }
        const text = this.dateFormat.serialize(draft);
        return this.existingOptions().some(
            (t) =>
                this.dateFormat.serialize(this.dateFormat.parse(t, type)) ===
                text,
        );
    });

    add = output<NewOptionPayload>();
    cancelled = output<void>();

    readonly textDraft = signal<OptionEntry>({ text: '', description: '' });
    readonly dateDraft = signal<DateOptionEntry>({ type: 'date' });
    /** A link preview is in flight — it will still rewrite textDraft when it lands. */
    private readonly previewPending = signal(false);
    /** "Add" was pressed while the preview was in flight; submit once it settles. */
    protected readonly submitQueued = signal(false);

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
            return (
                this.dateFormat.isValid(this.dateDraft()) && !this.isDuplicate()
            );
        }
        const draft = this.textDraft();
        return (
            !!draft.text.trim() &&
            draft.text.length <= POLL_LIMITS.optionTextLength &&
            (!draft.meta?.url || this.urlValidation.isValid(draft.meta.url))
        );
    });

    submit(): void {
        // Clicking "Add" blurs a URL title, which starts the preview fetch. Submitting now would
        // add the bare URL and the preview would then refill the cleared draft, tempting a second
        // add — so wait for the preview and add once, with its data.
        if (this.previewPending()) {
            this.submitQueued.set(true);
            return;
        }
        if (!this.isValid()) {
            return;
        }
        if (isDateOptionType(this.optionType())) {
            this.add.emit({
                text: this.dateFormat.serialize(this.dateDraft()),
                description: '',
            });
            const fresh = this.freshDateEntry(this.dateType()!);
            // Keep the picked times so several days at the same time are quick to add.
            const { startTime, endTime } = this.dateDraft();
            this.dateDraft.set(
                this.usesCalendar() ||
                    this.usesWeekdayPicker() ||
                    this.usesRangePicker()
                    ? { ...fresh, startTime, endTime }
                    : fresh,
            );
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

    onPreviewPendingChange(pending: boolean): void {
        this.previewPending.set(pending);
        if (!pending && this.submitQueued()) {
            this.submitQueued.set(false);
            this.submit();
        }
    }

    private freshDateEntry(type: DateOptionType): DateOptionEntry {
        if (type === 'time') {
            return { type, startTime: this.dateFormat.nextFullHour() };
        }
        if (type === 'time-range') {
            const start = this.dateFormat.nextFullHour();
            return {
                type,
                startTime: start,
                endTime: this.dateFormat.defaultEndTime(start),
            };
        }
        return { type };
    }
}
