import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatusTone = 'positive' | 'muted';

@Component({
  selector: 'ds-status-dot',
  template: `
    <span [style.color]="textColor()" class="ds-status-dot-wrap">
      <span [style.background]="dotColor()" class="ds-status-dot-circle"></span>
      <ng-content />
    </span>
  `,
  styles: [`
    .ds-status-dot-wrap {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: var(--fs-caption-sm);
      font-weight: var(--weight-bold);
    }
    .ds-status-dot-circle {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class DsStatusDotComponent {
  tone = input<StatusTone>('positive');

  protected readonly textColor = computed(() =>
    this.tone() === 'positive' ? 'var(--positive)' : 'var(--text-muted)',
  );
  protected readonly dotColor = computed(() =>
    this.tone() === 'positive' ? 'var(--positive-strong)' : 'var(--sand-500)',
  );
}
