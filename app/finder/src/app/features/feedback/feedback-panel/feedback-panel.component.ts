import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsTextareaComponent } from '@ds/textarea/ds-textarea.component';
import {
    DsSegmentedControlComponent,
    SegmentOption,
} from '@ds/segmented-control/ds-segmented-control.component';
import {
    FEEDBACK_MAX_COMMENT_LENGTH,
    FeedbackType,
    SubmitFeedbackRequest,
} from '../_models/feedback.model';

@Component({
    selector: 'app-feedback-panel',
    imports: [
        ReactiveFormsModule,
        TranslatePipe,
        DsButtonComponent,
        DsTextareaComponent,
        DsSegmentedControlComponent,
    ],
    templateUrl: './feedback-panel.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '(document:keydown.escape)': 'cancelled.emit()' },
})
export class FeedbackPanelComponent {
    private readonly translateService = inject(TranslateService);

    /** Current route, shown in the disclosure note and sent with the feedback. */
    readonly page = input.required<string>();
    readonly email = input.required<string>();
    readonly submitting = input(false);

    readonly send = output<SubmitFeedbackRequest>();
    readonly cancelled = output<void>();
    readonly hide = output<void>();

    protected readonly maxLength = FEEDBACK_MAX_COMMENT_LENGTH;
    protected readonly type = signal<FeedbackType>('Bug');
    protected readonly comment = new FormControl('', { nonNullable: true });

    private readonly commentValue = toSignal(this.comment.valueChanges, {
        initialValue: '',
    });
    protected readonly canSend = computed(
        () => this.commentValue().trim().length > 0 && !this.submitting(),
    );

    private readonly bugLabel =
        this.translateService.translate('feedback.types.Bug');
    private readonly ideaLabel = this.translateService.translate(
        'feedback.types.Idea',
    );
    private readonly otherLabel = this.translateService.translate(
        'feedback.types.Other',
    );

    protected readonly typeOptions = computed<SegmentOption[]>(() => [
        { value: 'Bug', label: this.bugLabel() },
        { value: 'Idea', label: this.ideaLabel() },
        { value: 'Other', label: this.otherLabel() },
    ]);

    protected onTypeChange(value: string): void {
        this.type.set(value as FeedbackType);
    }

    protected submit(): void {
        if (!this.canSend()) {
            return;
        }
        this.send.emit({
            type: this.type(),
            comment: this.comment.value.trim(),
            page: this.page(),
        });
    }
}
