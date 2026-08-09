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
      border-radius: var(--radius-xs);
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
      0%   { box-shadow: 0 0 0 0 rgba(93, 154, 86, 0.5); }
      70%  { box-shadow: 0 0 0 6px rgba(93, 154, 86, 0); }
      100% { box-shadow: 0 0 0 0 rgba(93, 154, 86, 0); }
    }
    .ds-status-dot--pulse {
      animation: ds-status-pulse 2.6s ease-out infinite;
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
