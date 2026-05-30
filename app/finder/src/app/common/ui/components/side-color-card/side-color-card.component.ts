import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-side-color-card',
  imports: [Card],
  templateUrl: './side-color-card.component.html',
  styleUrl: './side-color-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideColorCardComponent {
  color = input.required<'primary' | 'secondary' | 'tertiary'>();
  class = computed(() => {
    switch (this.color()) {
      case 'primary':
        return 'p-card-primary';
      case 'secondary':
        return 'p-card-secondary';
      case 'tertiary':
        return 'p-card-tertiary';
    }
  });
}
