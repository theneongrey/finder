import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ds-avatar',
  template: '{{ initial() }}',
  styleUrl: './avatar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.background]': 'bg()',
    '[style.color]': 'fg()',
  },
})
export class DsAvatarComponent {
  readonly initial = input.required<string>();
  readonly bg = input<string>('#e0e0e0');
  readonly fg = input<string>('#444');
}
