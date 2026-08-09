import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DsIconComponent } from '../icon/ds-icon.component';

export type BadgeTone = 'accent' | 'neutral' | 'warning' | 'viewer' | 'contributor' | 'manager' | 'success';
export type BadgeSize = 'sm' | 'md' | 'lg';

const BADGE_STYLES: Record<BadgeTone, { background: string; color: string }> = {
  accent:      { background: 'var(--accent-tint)',       color: 'var(--accent)' },
  neutral:     { background: 'var(--sand-100)',          color: 'var(--ink-400)' },
  warning:     { background: 'var(--amber-100)',         color: 'var(--warning)' },
  viewer:      { background: 'var(--sand-100)',          color: 'var(--ink-400)' },
  contributor: { background: 'var(--accent-tint)',       color: 'var(--accent)' },
  manager:     { background: 'var(--purple-badge-bg)',   color: 'var(--purple-fg)' },
  success:     { background: 'var(--green-badge-bg)',    color: 'var(--green-badge-fg)' },
};

const SIZE_STYLES: Record<BadgeSize, { padding: string; fontSize: string; minHeight: string }> = {
  sm: { padding: '0 6px',   fontSize: 'var(--fs-micro)',      minHeight: '20px' },
  md: { padding: '6px 13px', fontSize: 'var(--fs-ui-sm)',     minHeight: 'auto' },
  lg: { padding: '5px 11px', fontSize: 'var(--fs-caption-sm)', minHeight: '26px' },
};

@Component({
  selector: 'ds-badge',
  imports: [DsIconComponent],
  template: `
    <span
      [style.background]="style().background"
      [style.color]="style().color"
      [style.padding]="sizes().padding"
      [style.font-size]="sizes().fontSize"
      [style.min-height]="sizes().minHeight"
      class="ds-badge-pill">
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
      justify-content: center;
      gap: 6px;
      font-family: var(--font-body);
      font-weight: var(--weight-bold);
      border-radius: var(--radius-xs);
      white-space: nowrap;
      box-sizing: border-box;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class DsBadgeComponent {
  tone = input<BadgeTone>('neutral');
  size = input<BadgeSize>('md');
  icon = input<string | undefined>(undefined);

  protected readonly style = computed(() => BADGE_STYLES[this.tone()] ?? BADGE_STYLES['neutral']);
  protected readonly sizes = computed(() => SIZE_STYLES[this.size()] ?? SIZE_STYLES['md']);
}
