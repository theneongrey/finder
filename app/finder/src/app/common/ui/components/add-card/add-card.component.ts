import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-add-card',
  imports: [Card],
  templateUrl: './add-card.component.html',
  styleUrl: './add-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddCardComponent {
  cto = input<string>();
  description = input<string>('');
  icon = input<string>('pi-plus');
  disabled = input<boolean>(false);
  iconLeft = input<boolean>(false);
  action = output<void>();
}
