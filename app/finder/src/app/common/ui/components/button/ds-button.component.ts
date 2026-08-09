import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DsIconComponent } from '../icon/ds-icon.component';

export type ButtonVariant = 'primary' | 'dark' | 'outline' | 'subtle' | 'ghost';

const VARIANT_STYLES: Record<ButtonVariant, { background: string; color: string; border: string; boxShadow: string }> = {
  primary: { background: 'var(--accent)',    color: 'var(--text-on-accent)', border: 'none',                          boxShadow: 'var(--shadow-accent-btn)' },
  dark:    { background: 'var(--ink-900)',   color: '#fff',                  border: 'none',                          boxShadow: 'none' },
  outline: { background: '#fff',             color: 'var(--accent)',         border: '1.5px solid var(--accent)',      boxShadow: 'none' },
  subtle:  { background: 'var(--bg-panel)',  color: 'var(--ink-600)',        border: '1px solid var(--sand-300)',      boxShadow: 'none' },
  ghost:   { background: 'transparent',      color: 'var(--accent)',         border: 'none',                          boxShadow: 'none' },
};

@Component({
  selector: 'ds-button',
  imports: [DsIconComponent],
  template: `
    <button
      [disabled]="disabled() || loading()"
      [style.background]="style().background"
      [style.color]="style().color"
      [style.border]="style().border"
      [style.box-shadow]="style().boxShadow"
      [style.width]="fullWidth() ? '100%' : undefined"
      [style.padding]="variant() === 'ghost' ? '0' : '12px 18px'"
      [style.border-radius]="variant() === 'ghost' ? '0' : 'var(--radius-md)'"
      [style.font-size]="variant() === 'ghost' ? 'var(--fs-ui-sm)' : 'var(--fs-body-xs)'"
      [style.opacity]="(disabled() || loading()) ? '0.5' : '1'"
      class="ds-btn"
    >
      @if (loading()) {
        <span class="ds-btn__spinner"></span>
      } @else if (icon()) {
        <ds-icon [name]="icon()!" [size]="15" />
      }
      <ng-content />
    </button>
  `,
  styles: [`
    .ds-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-family: var(--font-body);
      font-weight: var(--weight-bold);
      cursor: pointer;
      white-space: nowrap;
      transition: opacity var(--duration-fast) var(--ease-standard);
    }
    .ds-btn:disabled { cursor: default; }
    .ds-btn__spinner {
      width: 14px;
      height: 14px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: ds-spin 0.6s linear infinite;
      flex-shrink: 0;
    }
    @keyframes ds-spin { to { transform: rotate(360deg); } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class DsButtonComponent {
  variant = input<ButtonVariant>('primary');
  icon = input<string | undefined>(undefined);
  fullWidth = input<boolean>(false);
  loading = input<boolean>(false);
  disabled = input<boolean>(false);

  protected readonly style = computed(() => VARIANT_STYLES[this.variant()] ?? VARIANT_STYLES['primary']);
}
