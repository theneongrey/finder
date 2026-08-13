import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ds-icon',
  templateUrl: './icon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsIconComponent {
  readonly name = input.required<string>();
}
