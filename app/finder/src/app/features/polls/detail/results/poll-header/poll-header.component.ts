import {
    ChangeDetectionStrategy,
    Component,
    input,
    output,
    signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { DsBadgeComponent } from '@ds/badge/ds-badge.component';
import { DsStatusDotComponent } from '@ds/badge/ds-status-dot.component';
import { DsInputComponent } from '@ds/input/ds-input.component';
import { DsTextareaComponent } from '@ds/textarea/ds-textarea.component';
import { POLL_LIMITS } from '../../../_shared/models/poll-limits';

export interface PollDetailsEdit {
    name: string;
    description: string;
}

@Component({
    selector: 'app-poll-header',
    templateUrl: './poll-header.component.html',
    imports: [
        FormsModule,
        TranslatePipe,
        DsButtonComponent,
        DsIconComponent,
        DsBadgeComponent,
        DsStatusDotComponent,
        DsInputComponent,
        DsTextareaComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollHeaderComponent {
    name = input.required<string>();
    description = input<string | undefined>(undefined);
    isClosed = input(false);
    canManage = input(false);
    typeLabel = input('');
    statusLabel = input('');
    closeDateText = input('');
    commentCount = input(0);
    sortLabel = input('');

    save = output<PollDetailsEdit>();
    delete = output<void>();
    toggleSort = output<void>();
    openComments = output<void>();

    protected readonly limits = POLL_LIMITS;

    protected readonly editing = signal(false);
    protected readonly deleteConfirm = signal(false);
    protected readonly editName = signal('');
    protected readonly editDescription = signal('');

    protected startEdit(): void {
        this.deleteConfirm.set(false);
        this.editName.set(this.name());
        this.editDescription.set(this.description() ?? '');
        this.editing.set(true);
    }

    protected cancelEdit(): void {
        this.editing.set(false);
    }

    protected saveEdit(): void {
        const name = this.editName().trim();
        if (!name) {
            return;
        }
        this.save.emit({ name, description: this.editDescription().trim() });
        this.editing.set(false);
    }

    protected confirmDelete(): void {
        this.delete.emit();
        this.deleteConfirm.set(false);
    }
}
