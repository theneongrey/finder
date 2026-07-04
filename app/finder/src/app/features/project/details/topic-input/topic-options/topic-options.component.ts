import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AddCardComponent } from '../../../../../common/ui/components/add-card/add-card.component';
import { OptionCardComponent } from './option-card/option-card.component';
import { OptionCardDateComponent } from './option-card-date/option-card-date.component';
import { OptionType } from '../../../_models/project-detail.model';

export interface OptionEntry {
  id?: string;
  text: string;
  description: string;
  meta?: { url: string; title?: string; description?: string; imageUrl?: string; siteName?: string };
}

export interface DateOptionEntry {
  id?: string;
  startDate: Date | null;
  endDate: Date | null;
}

@Component({
  selector: 'app-topic-options',
  templateUrl: './topic-options.component.html',
  styleUrl: './topic-options.component.css',
  imports: [
    AddCardComponent,
    TranslatePipe,
    OptionCardComponent,
    OptionCardDateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicOptionsComponent {
  readonly OptionType = OptionType;

  titleKey = input.required<string>();
  subtitleKey = input.required<string>();
  optionType = input.required<OptionType>();
  options = input.required<OptionEntry[]>();
  dateOptions = input.required<DateOptionEntry[]>();
  add = output<void>();
  remove = output<number>();

  addCardAnimating = signal(false);

  onAdd() {
    this.add.emit();
    this.triggerAddCardAnimation();
  }

  private triggerAddCardAnimation() {
    this.addCardAnimating.set(false);
    requestAnimationFrame(() => this.addCardAnimating.set(true));
  }
}
