import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'ds-button',
  imports: [HlmButton],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsButtonComponent {
  readonly variant = input<'primary' | 'ghost'>('primary');
}
