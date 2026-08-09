import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DsIconComponent } from '../icon/ds-icon.component';

export type IconButtonVariant = 'surface' | 'ghost' | 'dark';

const VARIANT_STYLES: Record<IconButtonVariant, { background: string; color: string; boxShadow: string }> = {
  surface: { background: '#fff',              color: 'var(--accent)',    boxShadow: 'var(--shadow-fab)' },
  ghost:   { background: 'transparent',       color: 'var(--ink-250)',   boxShadow: 'none' },
  dark:    { background: 'var(--sand-200)',   color: 'var(--ink-500)',   boxShadow: 'none' },
};

@Component({
  selector: 'ds-icon-button',
  imports: [DsIconComponent],
  template: `
    <button
      [attr.title]="title()"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.background]="style().background"
      [style.color]="style().color"
      [style.box-shadow]="style().boxShadow"
      class="ds-icon-btn"
    >
      <ds-icon [name]="icon()" [size]="iconSize()" />
    </button>
  `,
  styles: [`
    .ds-icon-btn {
      flex-shrink: 0;
      border: none;
      border-radius: var(--radius-circle);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
      transition: opacity var(--duration-fast) var(--ease-standard);
    }
    .ds-icon-btn:hover { opacity: 0.8; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class DsIconButtonComponent {
  icon = input.required<string>();
  variant = input<IconButtonVariant>('surface');
  size = input<number>(36);
  title = input<string | undefined>(undefined);

  protected readonly style = computed(() => VARIANT_STYLES[this.variant()] ?? VARIANT_STYLES['surface']);
  protected readonly iconSize = computed(() => Math.round(this.size() * 0.44));
}
