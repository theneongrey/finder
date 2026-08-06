import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { HlmCardImports } from '@spartan-ng/helm/card';

@Component({
  selector: 'app-add-card',
  imports: [...HlmCardImports],
  templateUrl: './add-card.component.html',
  styleUrl: './add-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddCardComponent {
  cto = input<string>();
  description = input<string>('');
  icon = input<string>('fa-plus');
  disabled = input<boolean>(false);
  iconLeft = input<boolean>(false);
  action = output<void>();
}
