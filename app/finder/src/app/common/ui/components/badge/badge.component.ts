import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ds-badge',
  template: '<ng-content />',
  styleUrl: './badge.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.background]': 'bg()',
    '[style.color]': 'fg()',
  },
})
export class DsBadgeComponent {
  readonly bg = input<string | undefined>(undefined);
  readonly fg = input<string | undefined>(undefined);
}
