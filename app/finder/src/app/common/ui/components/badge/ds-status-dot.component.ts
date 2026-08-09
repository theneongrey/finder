import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatusTone = 'positive' | 'muted';

@Component({
  selector: 'ds-status-dot',
  template: `
    <span
      [style.background]="pillBg()"
      [style.color]="pillFg()"
      class="ds-status-dot-wrap">
      <span
        [style.background]="dotColor()"
        [class.ds-status-dot--pulse]="tone() === 'positive'"
        class="ds-status-dot-circle">
      </span>
      <ng-content />
    </span>
  `,
  styles: [`
    .ds-status-dot-wrap {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 23px;
      padding: 0 10px 0 8px;
      border-radius: var(--radius-sm);
      font-size: var(--fs-caption);
      font-weight: var(--weight-bold);
    }
    .ds-status-dot-circle {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    @keyframes ds-status-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.55; transform: scale(1.35); }
    }
    .ds-status-dot--pulse {
      animation: ds-status-pulse 1.5s ease-in-out infinite;
    }
  `],
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
