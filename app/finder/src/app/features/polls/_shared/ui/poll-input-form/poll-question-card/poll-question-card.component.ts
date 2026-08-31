import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    effect,
    Injector,
    inject,
    input,
    output,
    signal,
    viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { DsTextareaComponent } from '@ds/textarea/ds-textarea.component';
import { DsInputComponent } from '@ds/input/ds-input.component';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsCardComponent } from '@ds/card/ds-card.component';
import { POLL_LIMITS } from '../../../models/poll-limits';

@Component({
    selector: 'app-poll-question-card',
    templateUrl: './poll-question-card.component.html',
    imports: [
        FormsModule,
        TranslatePipe,
        DsIconComponent,
        DsTextareaComponent,
        DsInputComponent,
        DsButtonComponent,
        DsCardComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollQuestionCardComponent {
    protected readonly limits = POLL_LIMITS;

    mode = input.required<'add' | 'edit' | 'standalone'>();
    question = input.required<string>();
    questionChange = output<string>();
    description = input.required<string>();
    descriptionChange = output<string>();
    isClosed = input<boolean>(false);

    showDescription = signal(false);

    private injector = inject(Injector);
    private descriptionTextarea = viewChild<DsTextareaComponent>(
        'descriptionTextarea',
    );

    constructor() {
        effect(() => {
            if (this.description()) {
                this.showDescription.set(true);
            }
        });
    }

    toggleDescription(): void {
        this.showDescription.set(true);
        afterNextRender(() => this.descriptionTextarea()?.focus(), {
            injector: this.injector,
        });
    }

    onDescriptionBlur(): void {
        if (!this.description()) {
            this.showDescription.set(false);
        }
    }
}
