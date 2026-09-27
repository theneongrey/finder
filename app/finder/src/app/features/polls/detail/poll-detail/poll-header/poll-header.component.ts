import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    ElementRef,
    inject,
    input,
    output,
    signal,
    viewChild,
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
    styleUrl: './poll-header.component.css',
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
    /** Flash the comment button when a poll-level comment was just added remotely. */
    commentHighlight = input(false);
    sortLabel = input('');

    save = output<PollDetailsEdit>();
    delete = output<void>();
    toggleSort = output<void>();
    openComments = output<void>();

    protected readonly limits = POLL_LIMITS;

    private readonly destroyRef = inject(DestroyRef);
    private readonly stickyBar =
        viewChild<ElementRef<HTMLElement>>('stickyBar');
    /** True while the compact header is pinned (scrolled). In that reduced state we drop the edit
     *  affordance, leaving just the title and comment button. */
    protected readonly stuck = signal(false);

    constructor() {
        // Detect the "stuck" state without a layout-affecting sentinel: the bar is pinned once it
        // sits at its sticky offset. The offset moves with the title bar (--title-bar-offset), so
        // compare against the live computed `top` rather than a fixed margin.
        afterNextRender(() => {
            const el = this.stickyBar()?.nativeElement;
            if (!el) {
                return;
            }
            const update = () =>
                this.stuck.set(
                    window.scrollY > 0 &&
                        el.getBoundingClientRect().top <=
                            parseFloat(getComputedStyle(el).top) + 0.5,
                );
            window.addEventListener('scroll', update, { passive: true });
            this.destroyRef.onDestroy(() =>
                window.removeEventListener('scroll', update),
            );
        });
    }

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
