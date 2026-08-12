import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { DsIconComponent } from '../icon/ds-icon.component';

export type ButtonVariant = 'primary' | 'dark' | 'outline' | 'subtle' | 'ghost' | 'neutral';
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
  size         = input<ButtonSize>('md');
  icon         = input<string | undefined>(undefined);
  trailingIcon = input<string | undefined>(undefined);
  fullWidth    = input<boolean>(false);
  loading      = input<boolean>(false);
  disabled     = input<boolean>(false);

  protected readonly variantClass = computed(() => {
    const v = this.variant();
    const s = this.size();
    return `ds-btn--${v}${s === 'sm' ? ' ds-btn--sm' : ''}`;
  });
  protected readonly iconSize = computed(() => this.size() === 'sm' ? 13 : 15);
}
