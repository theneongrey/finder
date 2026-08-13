import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HlmBadge } from '@spartan-ng/helm/badge';
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
  sm: { padding: '0 6px',    fontSize: 'var(--fs-micro)',       minHeight: '20px' },
  md: { padding: '6px 13px', fontSize: 'var(--fs-ui-sm)',       minHeight: 'auto' },
  lg: { padding: '5px 11px', fontSize: 'var(--fs-caption-sm)', minHeight: '26px' },
};

@Component({
  selector: 'ds-badge',
  imports: [DsIconComponent, HlmBadge],
  templateUrl: './ds-badge.component.html',
  styleUrl: './ds-badge.component.css',
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
