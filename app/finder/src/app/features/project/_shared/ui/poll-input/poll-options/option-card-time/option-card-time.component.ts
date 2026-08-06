import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { TranslatePipe } from '@ngx-translate/core';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { DateOptionEntry, formatTime, parseTimeInput } from '../../../../utils/date-option.utils';

@Component({
  selector: 'app-option-card-time',
  templateUrl: './option-card-time.component.html',
  imports: [HlmButton, HlmInput, TranslatePipe, ...HlmCardImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardTimeComponent {
  option = input.required<DateOptionEntry>();
  index = input.required<number>();
  canRemove = input<boolean>(false);
  remove = output<void>();

  protected getTimeValue(date: Date | undefined): string {
    return date ? formatTime(date) : '';
  }

  setStartTime(event: Event): void {
    this.option().startTime = parseTimeInput((event.target as HTMLInputElement).value);
  }
}
