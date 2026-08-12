import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DsIconComponent } from '../icon/ds-icon.component';

@Component({
  selector: 'app-add-card',
  imports: [DsIconComponent],
  templateUrl: './add-card.component.html',
  styleUrl: './add-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddCardComponent {
  cto = input<string>();
  description = input<string>('');
  icon = input<string>('plus');
  disabled = input<boolean>(false);
  iconLeft = input<boolean>(false);

  action = output<void>();

  protected readonly dsIcon = computed(() => {
    const raw = this.icon();
    if (raw.startsWith('fa-')) return 'plus';
    return raw;
  });
}
