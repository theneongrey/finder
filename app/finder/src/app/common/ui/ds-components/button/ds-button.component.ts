import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { DsIconComponent } from '../icon/ds-icon.component';

export type ButtonVariant = 'primary' | 'dark' | 'outline' | 'subtle' | 'ghost' | 'neutral' | 'surface' | 'teal' | 'soft' | 'danger';
export type ButtonSize = 'sm' | 'md';

@Component({
  selector: 'ds-button',
  imports: [DsIconComponent, HlmButton],
  templateUrl: './ds-button.component.html',
  styleUrl: './ds-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class DsButtonComponent {
  variant      = input<ButtonVariant>('primary');
  /** Pass 'sm' | 'md' for text buttons; pass a pixel number for an icon-only circular button. */
  size         = input<ButtonSize | number>('md');
  icon         = input<string | undefined>(undefined);
  trailingIcon = input<string | undefined>(undefined);
  color        = input<string | undefined>(undefined);
  label        = input<string | undefined>(undefined);
  fullWidth    = input<boolean>(false);
  loading      = input<boolean>(false);
  disabled     = input<boolean>(false);
  noGlow       = input<boolean>(true);
  square        = input<boolean>(false);

  protected readonly isIconOnly = computed(() => typeof this.size() === 'number');

  protected readonly variantClass = computed(() => {
    const v = this.variant();
    const s = this.size();
    if (typeof s === 'number') { return `ds-btn--${v} ds-btn--icon-only${this.square() ? ' ds-btn--square' : ''}`; }
    return s === 'sm' ? `ds-btn--${v} ds-btn--sm` : `ds-btn--${v}`;
  });

  protected readonly iconSize = computed(() => {
    const s = this.size();
    if (typeof s === 'number') { return Math.round(s * 0.44); }
    return s === 'sm' ? 13 : 15;
  });

  protected readonly widthStyle = computed(() => {
    const s = this.size();
    if (typeof s === 'number') { return `${s}px`; }
    return this.fullWidth() ? '100%' : null;
  });

  protected readonly heightStyle = computed(() => {
    const s = this.size();
    return typeof s === 'number' ? `${s}px` : null;
  });
}
