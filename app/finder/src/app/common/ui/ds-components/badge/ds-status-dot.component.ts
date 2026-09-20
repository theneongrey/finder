import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
} from '@angular/core';

export type StatusTone = 'positive' | 'muted';

@Component({
    selector: 'ds-status-dot',
    templateUrl: './ds-status-dot.component.html',
    styleUrl: './ds-status-dot.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { style: 'display: contents' },
})
export class DsStatusDotComponent {
    tone = input<StatusTone>('positive');

    protected readonly wrapClass = computed(() =>
        this.tone() === 'positive'
            ? 'bg-[var(--green-badge-bg)] text-[var(--green-badge-fg)]'
            : 'bg-[var(--cream-300)] text-[var(--text-muted)]',
    );
    protected readonly dotClass = computed(() =>
        this.tone() === 'positive'
            ? 'bg-[var(--positive-strong)]'
            : 'bg-[var(--sand-500)]',
    );
}
