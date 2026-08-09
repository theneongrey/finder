import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DsIconComponent } from '../icon/ds-icon.component';

export type BadgeTone = 'accent' | 'neutral' | 'warning' | 'viewer' | 'contributor' | 'manager' | 'success';

const BADGE_STYLES: Record<BadgeTone, { background: string; color: string }> = {
  accent:      { background: 'var(--accent-tint)',       color: 'var(--accent)' },
  neutral:     { background: 'var(--sand-100)',          color: 'var(--ink-400)' },
  warning:     { background: 'var(--amber-100)',         color: 'var(--warning)' },
  viewer:      { background: 'var(--sand-100)',          color: 'var(--ink-400)' },
  contributor: { background: 'var(--accent-tint)',       color: 'var(--accent)' },
  manager:     { background: 'var(--purple-badge-bg)',   color: 'var(--purple-fg)' },
  success:     { background: 'var(--green-badge-bg)',    color: 'var(--green-badge-fg)' },
};

@Component({
  selector: 'ds-badge',
  imports: [DsIconComponent],
  template: `
    <span [style.background]="style().background" [style.color]="style().color" class="ds-badge-pill">
      @if (icon()) {
        <ds-icon [name]="icon()!" [size]="12" />
      }
      <ng-content />
    </span>
  `,
  styles: [`
    .ds-badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-body);
      font-size: var(--fs-ui-sm);
      font-weight: var(--weight-bold);
      padding: 6px 13px;
      border-radius: var(--radius-pill);
      white-space: nowrap;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class DsBadgeComponent {
  tone = input<BadgeTone>('neutral');
  icon = input<string | undefined>(undefined);

  protected readonly style = computed(() => BADGE_STYLES[this.tone()] ?? BADGE_STYLES['neutral']);
}
