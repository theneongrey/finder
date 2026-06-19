import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { AddCardComponent } from '../../../../common/ui/components/add-card/add-card.component';
import { TranslatePipe } from '@ngx-translate/core';
import { OptionCardComponent } from './option-card/option-card.component';

export interface OptionEntry {
  id?: string;
  text: string;
  description: string;
  url: string;
}

@Component({
  selector: 'app-topic-options',
  templateUrl: './topic-options.component.html',
  styleUrl: './topic-options.component.css',
  imports: [AddCardComponent, TranslatePipe, OptionCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicOptionsComponent {
  options = input.required<OptionEntry[]>();
  add = output<void>();
  remove = output<number>();

  addCardAnimating = signal(false);

  onAdd() {
    this.add.emit();
    this.triggerAddCardAnimation();
  }

  onRemove(index: number) {
    this.remove.emit(index);
    this.triggerAddCardAnimation();
  }

  private triggerAddCardAnimation() {
    this.addCardAnimating.set(false);
    requestAnimationFrame(() => this.addCardAnimating.set(true));
  }
}
