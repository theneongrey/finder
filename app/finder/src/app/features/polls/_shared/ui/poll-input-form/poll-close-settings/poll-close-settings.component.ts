import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    Injector,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { DsInputComponent } from '@ds/input/ds-input.component';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsCardComponent } from '@ds/card/ds-card.component';

@Component({
    selector: 'app-poll-close-settings',
    templateUrl: './poll-close-settings.component.html',
    styleUrl: './poll-close-settings.component.css',
    imports: [
        DatePipe,
        FormsModule,
        TranslatePipe,
        DsInputComponent,
        DsButtonComponent,
        DsCardComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollCloseSettingsComponent {
    mode = input.required<'add' | 'edit' | 'standalone'>();
    closeDate = input<string | undefined>(undefined);
    closeDateChange = output<string | undefined>();
    isClosed = input<boolean>(false);
    closedAt = input<string | undefined>(undefined);
    closePollNow = output<void>();
    reopenPoll = output<void>();

    readonly deadlinePresets = [
        { id: 'd3', labelKey: 'project.pollInput.autoCloseIn3Days' },
        { id: 'w1', labelKey: 'project.pollInput.autoCloseIn1Week' },
        { id: 'w2', labelKey: 'project.pollInput.autoCloseIn2Weeks' },
        { id: 'none', labelKey: 'project.pollInput.autoCloseNoEnd' },
    ];

    selectedDeadline = signal<string | undefined>(undefined);
    anonymousVoting = signal(false);

    private injector = inject(Injector);

    constructor() {
        afterNextRender(
            () => {
                if (this.mode() !== 'edit' && !this.closeDate()) {
                    this.onDeadlinePreset('w1');
                }
            },
            { injector: this.injector },
        );
    }

    get customEndValue(): string {
        const cd = this.closeDate();
        if (!cd) {
            return '';
        }
        return cd.substring(0, 16);
    }

    onDeadlinePreset(id: string): void {
        this.selectedDeadline.set(id);
        if (id === 'none') {
            this.closeDateChange.emit(undefined);
            return;
        }
        const days = id === 'd3' ? 3 : id === 'w1' ? 7 : 14;
        const d = new Date();
        d.setDate(d.getDate() + days);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        this.closeDateChange.emit(`${year}-${month}-${day}T18:00:00.000Z`);
    }

    onCustomEndChange(value: string): void {
        this.selectedDeadline.set(undefined);
        if (!value) {
            this.closeDateChange.emit(undefined);
            return;
        }
        this.closeDateChange.emit(`${value}:00.000Z`);
    }

    toggleAnonymousVoting(): void {
        this.anonymousVoting.update((v) => !v);
    }
}
