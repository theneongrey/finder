import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { DsIconComponent } from '../icon/ds-icon.component';

export type IconButtonVariant = 'surface' | 'ghost' | 'dark' | 'teal';

@Component({
  selector: 'ds-icon-button',
  imports: [DsIconComponent, HlmButton],
  templateUrl: './ds-icon-button.component.html',
  styleUrl: './ds-icon-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class DsIconButtonComponent {
  icon = input.required<string>();
  variant = input<IconButtonVariant>('surface');
  size = input<number>(36);
  title = input<string | undefined>(undefined);

  protected readonly variantClass = computed(() => `ds-ib--${this.variant()}`);
  protected readonly iconSize = computed(() => Math.round(this.size() * 0.44));
}
