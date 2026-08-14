import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

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

  protected readonly pillBg  = computed(() =>
    this.tone() === 'positive' ? 'var(--green-badge-bg)' : 'var(--cream-300)',
  );
  protected readonly pillFg  = computed(() =>
    this.tone() === 'positive' ? 'var(--green-badge-fg)' : 'var(--text-muted)',
  );
  protected readonly dotColor = computed(() =>
    this.tone() === 'positive' ? 'var(--positive-strong)' : 'var(--sand-500)',
  );
}
