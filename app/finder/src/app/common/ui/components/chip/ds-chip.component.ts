import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { DsIconComponent } from '../icon/ds-icon.component';

@Component({
  selector: 'ds-chip',
  imports: [DsIconComponent],
  templateUrl: './ds-chip.component.html',
  styleUrl: './ds-chip.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class DsChipComponent {
  active = model<boolean>(false);
  label  = input.required<string>();
  icon   = input<string | undefined>(undefined);

  toggle(): void {
    this.active.set(!this.active());
  }
}
